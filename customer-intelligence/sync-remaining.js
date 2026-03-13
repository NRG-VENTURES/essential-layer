require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
const API = process.env.JUDGEME_API_TOKEN;
const SHOP = process.env.JUDGEME_SHOP_DOMAIN;

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

// Fetch ALL pages that we're missing
const existingCount = runSQL('SELECT COUNT(*) as c FROM reviews')[0].c;
console.log(`Current reviews: ${existingCount}, target: ~7108`);

const existingIds = new Set(runSQL('SELECT judgeme_review_id FROM reviews').map(r => r.judgeme_review_id));
console.log(`Existing IDs loaded: ${existingIds.size}`);

// Re-fetch pages that had DNS issues
let reviews = [];
for (let page = 19; page <= 34; page++) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = execSync(
        `curl -s --max-time 30 "https://judge.me/api/v1/reviews?api_token=${API}&shop_domain=${SHOP}&per_page=100&page=${page}"`,
        { maxBuffer: 50 * 1024 * 1024 }
      ).toString();
      if (r.includes('DNS')) { execSync(`sleep ${3 * (a + 1)}`); continue; }
      const data = JSON.parse(r);
      reviews = reviews.concat(data.reviews || []);
      break;
    } catch (e) {
      if (a < 3) { execSync(`sleep ${3 * (a + 1)}`); continue; }
      console.error(`Failed page ${page}`);
    }
  }
  console.log(`Page ${page}: ${reviews.length} total`);
  execSync('sleep 2');
}

const newRevs = reviews.filter(r => {
  return !existingIds.has(r.id);
});
console.log(`New reviews to insert: ${newRevs.length}`);

if (newRevs.length === 0) {
  console.log('Nothing to insert!');
  process.exit(0);
}

// Insert customers for new reviews
const cm = new Map();
for (const r of newRevs) {
  if (!r.reviewer) continue;
  if (!cm.has(r.reviewer.id)) cm.set(r.reviewer.id, { rv: r.reviewer, rs: [] });
  cm.get(r.reviewer.id).rs.push(r);
}

console.log(`Inserting ${cm.size} customers...`);
const entries = [...cm.values()];
for (let i = 0; i < entries.length; i += 25) {
  const batch = entries.slice(i, i + 25);
  const vals = batch.map(({ rv, rs }) => {
    const avg = rs.reduce((a, r) => a + r.rating, 0) / rs.length;
    const d = rs.map(r => new Date(r.created_at)).sort((a, b) => a - b);
    const p = [...new Set(rs.map(r => r.product_title).filter(Boolean))].slice(0, 10);
    return `(${[esc(rv.id), esc(rv.external_id || null), esc(rv.email || null), esc(rv.name || null), esc(rv.phone || null), esc(rv.accepts_marketing || false), esc(rv.tags || []), esc(rs.length), esc(parseFloat(avg.toFixed(2))), esc(d[0]?.toISOString()), esc(d[d.length - 1]?.toISOString()), esc('Mixed'), esc(p), esc({})].join(',')})`;
  });
  try {
    runSQL(`INSERT INTO customers (judgeme_reviewer_id,shopify_customer_id,email,name,phone,accepts_marketing,tags,total_reviews,average_rating,first_review_date,last_review_date,sentiment_summary,top_products,product_preferences) VALUES ${vals.join(',')} ON CONFLICT (judgeme_reviewer_id) DO UPDATE SET total_reviews=customers.total_reviews+EXCLUDED.total_reviews,updated_at=NOW()`);
  } catch (e) { console.error('Cust err:', e.message.substring(0, 80)); }
}

// Get ID map
const idMap = new Map();
for (const row of runSQL('SELECT id,judgeme_reviewer_id FROM customers')) {
  idMap.set(row.judgeme_reviewer_id, row.id);
}

// Insert reviews
console.log(`Inserting ${newRevs.length} reviews...`);
const themeMap = { sizing: ['size', 'fit', 'tight', 'loose'], comfort: ['comfort', 'soft', 'cozy'], quality: ['quality', 'durable'], allergies: ['allergy', 'allergic', 'sensitive', 'eczema', 'rash', 'irritat'], material: ['cotton', 'organic', 'fabric', 'latex'] };
let ins = 0;
for (let i = 0; i < newRevs.length; i += 25) {
  const batch = newRevs.slice(i, i + 25);
  const vals = batch.map(r => {
    const t = (r.body || '').toLowerCase();
    const sent = r.rating >= 4 ? 'positive' : r.rating <= 2 ? 'negative' : 'neutral';
    const themes = [];
    for (const [tk, kw] of Object.entries(themeMap)) { if (kw.some(k => t.includes(k))) themes.push(tk); }
    const cid = r.reviewer ? idMap.get(r.reviewer.id) : null;
    return `(${[esc(r.id), esc(cid), esc(r.title), esc(r.body), esc(r.rating), esc(r.product_external_id), esc(r.product_title), esc(r.product_handle), esc(r.source), esc(r.verified), esc(r.published), esc(r.featured), esc(r.has_published_pictures), esc(r.has_published_videos), esc(sent), esc(sent === 'positive' ? 0.85 : sent === 'negative' ? 0.3 : 0.5), esc(themes), esc(r.created_at)].join(',')})`;
  });
  try {
    runSQL(`INSERT INTO reviews (judgeme_review_id,customer_id,title,body,rating,product_external_id,product_title,product_handle,source,verified,published,featured,has_pictures,has_videos,sentiment,sentiment_score,key_themes,review_date) VALUES ${vals.join(',')} ON CONFLICT (judgeme_review_id) DO NOTHING`);
    ins += batch.length;
  } catch (e) { console.error('Rev err:', e.message.substring(0, 80)); }
  process.stdout.write(`\r  ${ins}/${newRevs.length}`);
}
console.log('');
console.log(`Inserted: ${ins}`);
const f1 = runSQL('SELECT COUNT(*) as c FROM reviews');
const f2 = runSQL('SELECT COUNT(*) as c FROM customers');
console.log(`FINAL: ${f1[0]?.c} reviews, ${f2[0]?.c} customers`);
