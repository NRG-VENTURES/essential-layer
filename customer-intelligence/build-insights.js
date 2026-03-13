require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];

function runSQL(sql) {
  const f = `/tmp/sb-${Date.now()}.json`;
  fs.writeFileSync(f, JSON.stringify({ query: sql }));
  for (let i = 0; i < 4; i++) {
    try {
      const r = execSync(
        `curl -s --max-time 60 -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" -H "Authorization: Bearer ${PAT}" -H "Content-Type: application/json" -d @${f}`,
        { maxBuffer: 50 * 1024 * 1024 }
      ).toString();
      if (r.includes('DNS')) { execSync(`sleep ${3 * (i + 1)}`); continue; }
      try { fs.unlinkSync(f); } catch {}
      return r.trim() ? JSON.parse(r) : [];
    } catch (e) {
      if (i < 3) { execSync(`sleep ${3 * (i + 1)}`); continue; }
      throw e;
    }
  }
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "'{}'";
    return "ARRAY[" + v.map(x => "'" + String(x).replace(/'/g, "''") + "'").join(',') + "]::TEXT[]";
  }
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::JSONB";
  return "'" + String(v).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

console.log('=== Building Customer Insights ===\n');

// Build insights using SQL aggregation directly
console.log('Generating insights via SQL...');

// Insert insights for all customers using a single SQL query
const sql = `
INSERT INTO customer_insights (customer_id, overall_sentiment, loyalty_tier, product_categories, positive_themes, negative_themes, sizing_notes, material_preferences, ai_summary, last_analyzed)
SELECT
  c.id,
  c.sentiment_summary,
  CASE
    WHEN c.total_reviews >= 10 THEN 'Champion'
    WHEN c.total_reviews >= 5 THEN 'Loyal'
    WHEN c.total_reviews >= 2 THEN 'Returning'
    ELSE 'New'
  END,
  COALESCE(c.top_products, '{}'),
  COALESCE(
    (SELECT ARRAY_AGG(DISTINCT unnest) FROM unnest(
      (SELECT ARRAY_AGG(theme) FROM reviews r, unnest(r.key_themes) theme WHERE r.customer_id = c.id AND r.sentiment = 'positive')
    )),
    '{}'
  ),
  COALESCE(
    (SELECT ARRAY_AGG(DISTINCT unnest) FROM unnest(
      (SELECT ARRAY_AGG(theme) FROM reviews r, unnest(r.key_themes) theme WHERE r.customer_id = c.id AND r.sentiment = 'negative')
    )),
    '{}'
  ),
  (SELECT string_agg(r.body, ' | ' ORDER BY r.review_date DESC)
   FROM reviews r WHERE r.customer_id = c.id
   AND (r.body ILIKE '%size%' OR r.body ILIKE '%fit%' OR r.body ILIKE '%tight%' OR r.body ILIKE '%loose%')
   LIMIT 3),
  (SELECT string_agg(r.body, ' | ' ORDER BY r.review_date DESC)
   FROM reviews r WHERE r.customer_id = c.id
   AND (r.body ILIKE '%cotton%' OR r.body ILIKE '%fabric%' OR r.body ILIKE '%material%' OR r.body ILIKE '%organic%' OR r.body ILIKE '%latex%')
   LIMIT 3),
  CONCAT(
    COALESCE(c.name, 'Anonymous'), ' has written ', c.total_reviews, ' review(s) with avg rating ', c.average_rating, '/5. ',
    'Sentiment: ', c.sentiment_summary, '. ',
    'Loyalty: ', CASE WHEN c.total_reviews >= 10 THEN 'Champion' WHEN c.total_reviews >= 5 THEN 'Loyal' WHEN c.total_reviews >= 2 THEN 'Returning' ELSE 'New' END, '. ',
    'Products: ', COALESCE(array_to_string(c.top_products, ', '), 'none'), '.'
  ),
  NOW()
FROM customers c
ON CONFLICT (customer_id) DO UPDATE SET
  overall_sentiment = EXCLUDED.overall_sentiment,
  loyalty_tier = EXCLUDED.loyalty_tier,
  product_categories = EXCLUDED.product_categories,
  ai_summary = EXCLUDED.ai_summary,
  last_analyzed = NOW()
`;

try {
  runSQL(sql);
  console.log('  Insights generated!\n');
} catch (e) {
  console.error('Complex query failed, using simplified version...');

  // Simpler approach: just build basic insights
  const simpleSql = `
  INSERT INTO customer_insights (customer_id, overall_sentiment, loyalty_tier, product_categories, ai_summary, last_analyzed)
  SELECT
    c.id,
    c.sentiment_summary,
    CASE
      WHEN c.total_reviews >= 10 THEN 'Champion'
      WHEN c.total_reviews >= 5 THEN 'Loyal'
      WHEN c.total_reviews >= 2 THEN 'Returning'
      ELSE 'New'
    END,
    COALESCE(c.top_products, '{}'),
    CONCAT(
      COALESCE(c.name, 'Anonymous'), ' has written ', c.total_reviews, ' review(s) with avg rating ', c.average_rating, '/5. ',
      'Sentiment: ', c.sentiment_summary, '. ',
      'Loyalty: ', CASE WHEN c.total_reviews >= 10 THEN 'Champion' WHEN c.total_reviews >= 5 THEN 'Loyal' WHEN c.total_reviews >= 2 THEN 'Returning' ELSE 'New' END, '.'
    ),
    NOW()
  FROM customers c
  ON CONFLICT (customer_id) DO UPDATE SET
    overall_sentiment = EXCLUDED.overall_sentiment,
    loyalty_tier = EXCLUDED.loyalty_tier,
    product_categories = EXCLUDED.product_categories,
    ai_summary = EXCLUDED.ai_summary,
    last_analyzed = NOW()
  `;
  runSQL(simpleSql);
  console.log('  Basic insights generated!\n');
}

// Print stats
const stats = runSQL(`
  SELECT
    loyalty_tier,
    COUNT(*) as count
  FROM customer_insights
  GROUP BY loyalty_tier
  ORDER BY count DESC
`);

console.log('=== Customer Loyalty Tiers ===');
for (const row of stats) {
  console.log(`  ${row.loyalty_tier}: ${row.count}`);
}

const topCustomers = runSQL(`
  SELECT c.name, c.email, c.total_reviews, c.average_rating, ci.loyalty_tier
  FROM customers c
  JOIN customer_insights ci ON ci.customer_id = c.id
  ORDER BY c.total_reviews DESC
  LIMIT 15
`);

console.log('\n=== Top 15 Customers ===');
for (const c of topCustomers) {
  console.log(`  ${c.name || 'Anonymous'} (${c.email || 'no email'}) — ${c.total_reviews} reviews, avg ${c.average_rating}★, ${c.loyalty_tier}`);
}

const sentimentStats = runSQL(`
  SELECT
    overall_sentiment,
    COUNT(*) as count
  FROM customer_insights
  GROUP BY overall_sentiment
  ORDER BY count DESC
`);

console.log('\n=== Sentiment Distribution ===');
for (const row of sentimentStats) {
  console.log(`  ${row.overall_sentiment}: ${row.count}`);
}

console.log('\nDone! Use: node ask-claude.js "your question"');
