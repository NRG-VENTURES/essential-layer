require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const API_TOKEN = process.env.JUDGEME_API_TOKEN;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN;
const PER_PAGE = 100;

function curlGet(url) {
  const result = execSync(
    `curl -s --max-time 30 "${url}"`,
    { maxBuffer: 50 * 1024 * 1024 }
  ).toString();
  return JSON.parse(result);
}

function supabasePost(table, data, onConflict) {
  const tmpFile = `/tmp/sb-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  fs.writeFileSync(tmpFile, JSON.stringify(Array.isArray(data) ? data : [data]));

  const conflictParam = onConflict ? `?on_conflict=${onConflict}` : '';
  try {
    const result = execSync(
      `curl -s --max-time 60 -X POST "${SUPABASE_URL}/rest/v1/${table}${conflictParam}" ` +
      `-H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" ` +
      `-H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates,return=representation" ` +
      `-d @${tmpFile}`,
      { maxBuffer: 50 * 1024 * 1024 }
    ).toString();
    fs.unlinkSync(tmpFile);
    if (!result.trim()) return { data: null, error: null };
    const parsed = JSON.parse(result);
    if (parsed.code && parsed.message) return { data: null, error: parsed };
    return { data: parsed, error: null };
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch {}
    return { data: null, error: { message: e.message } };
  }
}

function supabaseGet(table, params) {
  const qs = params ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
  const result = execSync(
    `curl -s --max-time 30 "${SUPABASE_URL}/rest/v1/${table}${qs}" ` +
    `-H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"`,
    { maxBuffer: 50 * 1024 * 1024 }
  ).toString();
  if (!result.trim()) return [];
  return JSON.parse(result);
}

function supabaseCount(table) {
  const result = execSync(
    `curl -s --max-time 30 -I "${SUPABASE_URL}/rest/v1/${table}?select=id" ` +
    `-H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" ` +
    `-H "Prefer: count=exact" -H "Range: 0-0"`,
    { maxBuffer: 1024 * 1024 }
  ).toString();
  const match = result.match(/content-range:\s*\d*-\d*\/(\d+)/i);
  return match ? parseInt(match[1]) : 0;
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
      console.error(`\n  Error on page ${page}: ${e.message}`);
      // Retry once
      try {
        execSync('sleep 2');
        const data = curlGet(url);
        allReviews = allReviews.concat(data.reviews || []);
      } catch {
        console.error(`  Retry failed on page ${page}, stopping.`);
        break;
      }
    }

    process.stdout.write(`\r  Fetched ${allReviews.length} reviews (page ${page})...`);
    page++;
  }

  console.log(`\n  Total: ${allReviews.length} reviews\n`);
  return allReviews;
}

function upsertCustomers(reviews) {
  console.log('Building customer profiles...');

  // Group by reviewer
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
  const customerIdMap = new Map();
  const batch = [];

  for (const [key, { reviewer, reviews: custReviews }] of customerMap) {
    const ratings = custReviews.map(r => r.rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const dates = custReviews.map(r => new Date(r.created_at)).sort((a, b) => a - b);
    const products = [...new Set(custReviews.map(r => r.product_title).filter(Boolean))];

    const productPrefs = {};
    for (const r of custReviews) {
      if (r.product_title) {
        if (!productPrefs[r.product_title]) {
          productPrefs[r.product_title] = { rating: r.rating, count: 1 };
        } else {
          productPrefs[r.product_title].count++;
          productPrefs[r.product_title].rating = Math.round(((productPrefs[r.product_title].rating * (productPrefs[r.product_title].count - 1)) + r.rating) / productPrefs[r.product_title].count * 100) / 100;
        }
      }
    }

    const sentiments = custReviews.map(r => analyzeSentiment(r.rating, r.body).sentiment);
    const posCount = sentiments.filter(s => s === 'positive').length;
    const negCount = sentiments.filter(s => s === 'negative').length;
    const overallSentiment = posCount > sentiments.length / 2 ? 'Generally positive'
      : negCount > sentiments.length / 2 ? 'Generally negative' : 'Mixed';

    batch.push({
      judgeme_reviewer_id: reviewer.id,
      shopify_customer_id: reviewer.external_id || null,
      email: reviewer.email || null,
      name: reviewer.name || null,
      phone: reviewer.phone || null,
      accepts_marketing: reviewer.accepts_marketing || false,
      tags: reviewer.tags || [],
      total_reviews: custReviews.length,
      average_rating: parseFloat(avgRating.toFixed(2)),
      first_review_date: dates[0]?.toISOString(),
      last_review_date: dates[dates.length - 1]?.toISOString(),
      sentiment_summary: overallSentiment,
      top_products: products.slice(0, 10),
      product_preferences: productPrefs,
      updated_at: new Date().toISOString()
    });

    // Upsert in batches of 50
    if (batch.length >= 50) {
      const { data, error } = supabasePost('customers', batch, 'judgeme_reviewer_id');
      if (error) {
        console.error(`\n  Batch error: ${error.message}`);
      } else if (data) {
        for (const row of data) {
          customerIdMap.set(row.judgeme_reviewer_id, row.id);
        }
      }
      processed += batch.length;
      process.stdout.write(`\r  Processed ${processed} customers...`);
      batch.length = 0;
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    const { data, error } = supabasePost('customers', batch, 'judgeme_reviewer_id');
    if (error) console.error(`\n  Batch error: ${error.message}`);
    else if (data) {
      for (const row of data) customerIdMap.set(row.judgeme_reviewer_id, row.id);
    }
    processed += batch.length;
  }

  console.log(`\n  Upserted ${processed} customers\n`);
  return customerIdMap;
}

function upsertReviews(reviews, customerIdMap) {
  console.log('Inserting reviews...');

  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const rows = batch.map(review => {
      const { sentiment, score } = analyzeSentiment(review.rating, review.body);
      const themes = extractThemes(review.body);
      const customerId = review.reviewer ? customerIdMap.get(review.reviewer.id) : null;

      return {
        judgeme_review_id: review.id,
        customer_id: customerId || null,
        title: review.title,
        body: review.body,
        rating: review.rating,
        product_external_id: review.product_external_id,
        product_title: review.product_title,
        product_handle: review.product_handle,
        source: review.source,
        verified: review.verified,
        published: review.published,
        featured: review.featured,
        has_pictures: review.has_published_pictures,
        has_videos: review.has_published_videos,
        sentiment,
        sentiment_score: score,
        key_themes: themes,
        review_date: review.created_at
      };
    });

    const { error } = supabasePost('reviews', rows, 'judgeme_review_id');
    if (error) {
      console.error(`\n  Batch error at ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  Inserted ${inserted}/${reviews.length} reviews...`);
  }

  console.log(`\n  Done: ${inserted} reviews inserted\n`);
}

function main() {
  console.log('=== JudgeMe → Supabase Review Sync ===\n');

  const reviews = fetchAllReviews();
  const customerIdMap = upsertCustomers(reviews);
  upsertReviews(reviews, customerIdMap);

  const customerCount = supabaseCount('customers');
  const reviewCount = supabaseCount('reviews');

  console.log('=== Sync Complete ===');
  console.log(`  Customers in DB: ${customerCount}`);
  console.log(`  Reviews in DB:   ${reviewCount}`);
  console.log('\nNext step: node build-insights.js');
}

main();
