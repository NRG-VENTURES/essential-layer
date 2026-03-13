require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const API_TOKEN = process.env.JUDGEME_API_TOKEN;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN;
const PER_PAGE = 100;

// Use Management API for SQL operations (more reliable in restricted environments)
function runSQL(sql, retries = 3) {
  const tmpFile = `/tmp/sb-sql-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  fs.writeFileSync(tmpFile, JSON.stringify({ query: sql }));

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = execSync(
        `curl -s --max-time 60 -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" ` +
        `-H "Authorization: Bearer ${SUPABASE_PAT}" ` +
        `-H "Content-Type: application/json" ` +
        `-d @${tmpFile}`,
        { maxBuffer: 50 * 1024 * 1024 }
      ).toString();

      if (result.includes('DNS cache overflow') || result.includes('Could not resolve')) {
        if (attempt < retries) { execSync(`sleep ${2 * (attempt + 1)}`); continue; }
        throw new Error('DNS cache overflow after retries');
      }

      try { fs.unlinkSync(tmpFile); } catch {}
      if (!result.trim()) return [];
      const parsed = JSON.parse(result);
      if (parsed.message && parsed.message.includes('error')) throw new Error(parsed.message);
      return parsed;
    } catch (e) {
      if (attempt < retries && (e.message.includes('DNS') || e.message.includes('timeout') || e.message.includes('Unexpected token'))) {
        execSync(`sleep ${2 * (attempt + 1)}`);
        continue;
      }
      try { fs.unlinkSync(tmpFile); } catch {}
      throw new Error(`SQL error: ${e.message}`);
    }
  }
}

function curlGet(url, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = execSync(
        `curl -s --max-time 30 "${url}"`,
        { maxBuffer: 50 * 1024 * 1024 }
      ).toString();
      if (result.includes('DNS cache overflow')) {
        if (attempt < maxRetries) { execSync(`sleep ${3 * (attempt + 1)}`); continue; }
        throw new Error('DNS cache overflow');
      }
      return JSON.parse(result);
    } catch (e) {
      if (attempt < maxRetries) { execSync(`sleep ${3 * (attempt + 1)}`); continue; }
      throw e;
    }
  }
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    return "ARRAY[" + val.map(v => "'" + String(v).replace(/'/g, "''") + "'").join(',') + "]::TEXT[]";
  }
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::JSONB";
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

function analyzeSentiment(rating, body) {
  const text = (body || '').toLowerCase();
  const negativeWords = ['disappointed', 'uncomfortable', 'too small', 'too big', 'poor', 'returned', 'return', 'bad', 'worst', 'terrible', 'hate', 'itchy', 'irritat', 'rash', 'allergic reaction', 'waste', 'cheaply made', 'fell apart', 'unhappy', 'wrong'];
  const positiveWords = ['love', 'amazing', 'comfortable', 'soft', 'perfect', 'great', 'wonderful', 'excellent', 'best', 'favorite', 'recommend', 'relief', 'lifesaver', 'thank', 'happy', 'pleased', 'fantastic', 'awesome'];
  const negCount = negativeWords.filter(w => text.includes(w)).length;
  const posCount = positiveWords.filter(w => text.includes(w)).length;
  if (rating >= 4 && negCount === 0) return { sentiment: 'positive', score: Math.min(0.999, 0.7 + (rating - 4) * 0.15 + posCount * 0.02) };
  if (rating <= 2 || negCount > posCount) return { sentiment: 'negative', score: Math.max(0.1, 0.5 - rating * 0.1 + negCount * 0.05) };
  return { sentiment: 'neutral', score: 0.5 };
}

function extractThemes(body) {
  const text = (body || '').toLowerCase();
  const themes = [];
  const themeMap = {
    'sizing': ['size', 'too small', 'too big', 'too large', 'tight', 'loose', 'fit', 'sizing'],
    'comfort': ['comfort', 'soft', 'cozy', 'gentle', 'smooth'],
    'quality': ['quality', 'durable', 'well made', 'well-made', 'sturdy', 'last'],
    'allergies': ['allergy', 'allergic', 'sensitive', 'reaction', 'eczema', 'dermatitis', 'rash', 'irritat', 'hypoallergenic'],
    'material': ['cotton', 'organic', 'fabric', 'material', 'latex', 'chemical'],
    'value': ['price', 'worth', 'expensive', 'value', 'affordable', 'cheap'],
    'washing': ['wash', 'laundry', 'shrink', 'dryer', 'dry'],
    'support': ['support', 'bra', 'elastic', 'strap'],
    'style': ['style', 'look', 'color', 'design', 'appearance'],
    'repeat_buyer': ['again', 'reorder', 'another', 'more of', 'stock up', 'buy more', 'ordering more']
  };
  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some(k => text.includes(k))) themes.push(theme);
  }
  return themes;
}

function fetchAllReviews() {
  let allReviews = [];
  let page = 1;
  let hasMore = true;

  console.log('Fetching reviews from JudgeMe...');

  while (hasMore) {
    const url = `https://judge.me/api/v1/reviews?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&per_page=${PER_PAGE}&page=${page}`;
    try {
      const data = curlGet(url);
      const reviews = data.reviews || [];
      allReviews = allReviews.concat(reviews);
      if (reviews.length < PER_PAGE) hasMore = false;
    } catch (e) {
      console.error(`\n  Failed page ${page}, stopping: ${e.message}`);
      break;
    }
    process.stdout.write(`\r  Fetched ${allReviews.length} reviews (page ${page})...`);
    page++;
    // Delay to avoid DNS cache overflow
    if (page % 3 === 0) execSync('sleep 1');
  }

  console.log(`\n  Total: ${allReviews.length} reviews\n`);
  return allReviews;
}

function upsertCustomers(reviews) {
  console.log('Building and inserting customer profiles via SQL...');

  const customerMap = new Map();
  for (const review of reviews) {
    const reviewer = review.reviewer;
    if (!reviewer || !reviewer.id) continue;
    if (!customerMap.has(reviewer.id)) {
      customerMap.set(reviewer.id, { reviewer, reviews: [] });
    }
    customerMap.get(reviewer.id).reviews.push(review);
  }

  console.log(`  Found ${customerMap.size} unique customers\n`);

  let processed = 0;
  const batchSize = 25;
  const entries = [...customerMap.values()];

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const values = batch.map(({ reviewer, reviews: custReviews }) => {
      const ratings = custReviews.map(r => r.rating);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const dates = custReviews.map(r => new Date(r.created_at)).sort((a, b) => a - b);
      const products = [...new Set(custReviews.map(r => r.product_title).filter(Boolean))];

      const productPrefs = {};
      for (const r of custReviews) {
        if (r.product_title) {
          if (!productPrefs[r.product_title]) productPrefs[r.product_title] = { rating: r.rating, count: 1 };
          else { productPrefs[r.product_title].count++; productPrefs[r.product_title].rating = r.rating; }
        }
      }

      const sentiments = custReviews.map(r => analyzeSentiment(r.rating, r.body).sentiment);
      const posCount = sentiments.filter(s => s === 'positive').length;
      const negCount = sentiments.filter(s => s === 'negative').length;
      const overallSentiment = posCount > sentiments.length / 2 ? 'Generally positive'
        : negCount > sentiments.length / 2 ? 'Generally negative' : 'Mixed';

      return `(${esc(reviewer.id)}, ${esc(reviewer.external_id || null)}, ${esc(reviewer.email || null)}, ` +
        `${esc(reviewer.name || null)}, ${esc(reviewer.phone || null)}, ${esc(reviewer.accepts_marketing || false)}, ` +
        `${esc(reviewer.tags || [])}, ${esc(custReviews.length)}, ${esc(parseFloat(avgRating.toFixed(2)))}, ` +
        `${esc(dates[0]?.toISOString())}, ${esc(dates[dates.length - 1]?.toISOString())}, ` +
        `${esc(overallSentiment)}, ${esc(products.slice(0, 10))}, ${esc(productPrefs)})`;
    });

    const sql = `INSERT INTO customers (judgeme_reviewer_id, shopify_customer_id, email, name, phone, accepts_marketing, tags, total_reviews, average_rating, first_review_date, last_review_date, sentiment_summary, top_products, product_preferences)
VALUES ${values.join(',\n')}
ON CONFLICT (judgeme_reviewer_id) DO UPDATE SET
  email = EXCLUDED.email, name = EXCLUDED.name, phone = EXCLUDED.phone,
  total_reviews = EXCLUDED.total_reviews, average_rating = EXCLUDED.average_rating,
  first_review_date = EXCLUDED.first_review_date, last_review_date = EXCLUDED.last_review_date,
  sentiment_summary = EXCLUDED.sentiment_summary, top_products = EXCLUDED.top_products,
  product_preferences = EXCLUDED.product_preferences, updated_at = NOW()
RETURNING id, judgeme_reviewer_id`;

    try {
      const result = runSQL(sql);
      processed += batch.length;
    } catch (e) {
      console.error(`\n  Batch error at ${i}: ${e.message.substring(0, 100)}`);
      // Try individual inserts for failed batch
      for (const entry of batch) {
        try {
          const singleValues = [entry].map(({ reviewer, reviews: custReviews }) => {
            const ratings = custReviews.map(r => r.rating);
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const dates = custReviews.map(r => new Date(r.created_at)).sort((a, b) => a - b);
            const products = [...new Set(custReviews.map(r => r.product_title).filter(Boolean))];
            const sentiments = custReviews.map(r => analyzeSentiment(r.rating, r.body).sentiment);
            const posCount = sentiments.filter(s => s === 'positive').length;
            const negCount = sentiments.filter(s => s === 'negative').length;
            const overallSentiment = posCount > sentiments.length / 2 ? 'Generally positive' : negCount > sentiments.length / 2 ? 'Generally negative' : 'Mixed';
            return `(${esc(reviewer.id)}, ${esc(reviewer.external_id || null)}, ${esc(reviewer.email || null)}, ${esc(reviewer.name || null)}, ${esc(reviewer.phone || null)}, ${esc(reviewer.accepts_marketing || false)}, ${esc([])}, ${esc(custReviews.length)}, ${esc(parseFloat(avgRating.toFixed(2)))}, ${esc(dates[0]?.toISOString())}, ${esc(dates[dates.length - 1]?.toISOString())}, ${esc(overallSentiment)}, ${esc(products.slice(0, 10))}, ${esc({})})`;
          });
          runSQL(`INSERT INTO customers (judgeme_reviewer_id, shopify_customer_id, email, name, phone, accepts_marketing, tags, total_reviews, average_rating, first_review_date, last_review_date, sentiment_summary, top_products, product_preferences) VALUES ${singleValues[0]} ON CONFLICT (judgeme_reviewer_id) DO NOTHING`);
          processed++;
        } catch {}
      }
    }
    process.stdout.write(`\r  Processed ${processed}/${entries.length} customers...`);
  }

  console.log(`\n  Upserted ${processed} customers\n`);

  // Get customer ID map
  console.log('  Fetching customer ID map...');
  const idMap = new Map();
  const rows = runSQL('SELECT id, judgeme_reviewer_id FROM customers');
  for (const row of rows) {
    idMap.set(row.judgeme_reviewer_id, row.id);
  }
  console.log(`  Got ${idMap.size} customer IDs\n`);
  return idMap;
}

function upsertReviews(reviews, customerIdMap) {
  console.log('Inserting reviews via SQL...');

  let inserted = 0;
  const batchSize = 25;

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const values = batch.map(review => {
      const { sentiment, score } = analyzeSentiment(review.rating, review.body);
      const themes = extractThemes(review.body);
      const customerId = review.reviewer ? customerIdMap.get(review.reviewer.id) : null;

      return `(${esc(review.id)}, ${esc(customerId)}, ${esc(review.title)}, ${esc(review.body)}, ` +
        `${esc(review.rating)}, ${esc(review.product_external_id)}, ${esc(review.product_title)}, ` +
        `${esc(review.product_handle)}, ${esc(review.source)}, ${esc(review.verified)}, ` +
        `${esc(review.published)}, ${esc(review.featured)}, ${esc(review.has_published_pictures)}, ` +
        `${esc(review.has_published_videos)}, ${esc(sentiment)}, ${esc(score)}, ` +
        `${esc(themes)}, ${esc(review.created_at)})`;
    });

    const sql = `INSERT INTO reviews (judgeme_review_id, customer_id, title, body, rating, product_external_id, product_title, product_handle, source, verified, published, featured, has_pictures, has_videos, sentiment, sentiment_score, key_themes, review_date)
VALUES ${values.join(',\n')}
ON CONFLICT (judgeme_review_id) DO NOTHING`;

    try {
      runSQL(sql);
      inserted += batch.length;
    } catch (e) {
      console.error(`\n  Batch error at ${i}: ${e.message.substring(0, 100)}`);
    }
    process.stdout.write(`\r  Inserted ${inserted}/${reviews.length} reviews...`);
  }

  console.log(`\n  Done: ${inserted} reviews inserted\n`);
}

function main() {
  console.log('=== JudgeMe → Supabase Review Sync ===\n');

  // Clear existing data for clean sync
  console.log('Clearing existing data...');
  runSQL('DELETE FROM customer_insights');
  runSQL('DELETE FROM reviews');
  runSQL('DELETE FROM customers');
  console.log('  Done\n');

  const reviews = fetchAllReviews();
  const customerIdMap = upsertCustomers(reviews);
  upsertReviews(reviews, customerIdMap);

  // Count
  const custCount = runSQL('SELECT COUNT(*) as c FROM customers');
  const revCount = runSQL('SELECT COUNT(*) as c FROM reviews');

  console.log('=== Sync Complete ===');
  console.log(`  Customers in DB: ${custCount[0]?.c || 0}`);
  console.log(`  Reviews in DB:   ${revCount[0]?.c || 0}`);
  console.log('\nNext step: node build-insights.js');
}

main();
