require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function buildInsight(customer, reviews) {
  const themes = {};
  const positiveThemes = [];
  const negativeThemes = [];
  let sizingNotes = [];
  let materialNotes = [];

  for (const review of reviews) {
    // Collect themes
    for (const theme of (review.key_themes || [])) {
      themes[theme] = (themes[theme] || 0) + 1;
    }

    const body = (review.body || '').toLowerCase();

    // Extract sizing notes
    if (body.includes('size') || body.includes('fit') || body.includes('tight') || body.includes('loose')) {
      sizingNotes.push(review.body);
    }

    // Extract material notes
    if (body.includes('cotton') || body.includes('fabric') || body.includes('material') || body.includes('organic') || body.includes('latex')) {
      materialNotes.push(review.body);
    }

    // Separate positive/negative themes
    if (review.sentiment === 'positive') {
      for (const t of (review.key_themes || [])) positiveThemes.push(t);
    } else if (review.sentiment === 'negative') {
      for (const t of (review.key_themes || [])) negativeThemes.push(t);
    }
  }

  // Determine loyalty tier
  let loyaltyTier = 'New';
  if (customer.total_reviews >= 10) loyaltyTier = 'Champion';
  else if (customer.total_reviews >= 5) loyaltyTier = 'Loyal';
  else if (customer.total_reviews >= 2) loyaltyTier = 'Returning';

  // Product categories
  const categories = [...new Set(reviews.map(r => r.product_title).filter(Boolean))];

  // Build AI summary
  const sentimentBreakdown = reviews.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, {});

  const summaryParts = [];
  summaryParts.push(`${customer.name || 'Anonymous'} has written ${customer.total_reviews} review(s) with an average rating of ${customer.average_rating}/5.`);
  summaryParts.push(`Sentiment: ${sentimentBreakdown.positive || 0} positive, ${sentimentBreakdown.neutral || 0} neutral, ${sentimentBreakdown.negative || 0} negative.`);
  summaryParts.push(`Loyalty tier: ${loyaltyTier}.`);
  if (categories.length > 0) summaryParts.push(`Products reviewed: ${categories.join(', ')}.`);
  if (Object.keys(themes).length > 0) {
    const topThemes = Object.entries(themes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
    summaryParts.push(`Key themes: ${topThemes.join(', ')}.`);
  }
  if (sizingNotes.length > 0) summaryParts.push(`Has mentioned sizing/fit in ${sizingNotes.length} review(s).`);
  if (customer.tags?.includes('Gold VIP') || customer.tags?.includes('Silver VIP')) {
    summaryParts.push(`VIP customer (${customer.tags.filter(t => t.includes('VIP')).join(', ')}).`);
  }

  return {
    customer_id: customer.id,
    overall_sentiment: customer.sentiment_summary,
    loyalty_tier: loyaltyTier,
    product_categories: categories.slice(0, 20),
    positive_themes: [...new Set(positiveThemes)].slice(0, 10),
    negative_themes: [...new Set(negativeThemes)].slice(0, 10),
    sizing_notes: sizingNotes.length > 0 ? sizingNotes.slice(0, 3).join(' | ') : null,
    material_preferences: materialNotes.length > 0 ? materialNotes.slice(0, 3).join(' | ') : null,
    ai_summary: summaryParts.join(' '),
    last_analyzed: new Date().toISOString()
  };
}

async function main() {
  console.log('=== Building Customer Insights ===\n');

  // Fetch all customers
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .order('total_reviews', { ascending: false });

  if (custErr) {
    console.error('Error fetching customers:', custErr.message);
    return;
  }

  console.log(`Processing ${customers.length} customers...\n`);

  let processed = 0;
  for (const customer of customers) {
    // Fetch reviews for this customer
    const { data: reviews, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('customer_id', customer.id);

    if (revErr || !reviews) continue;

    const insight = buildInsight(customer, reviews);

    const { error: insErr } = await supabase
      .from('customer_insights')
      .upsert(insight, { onConflict: 'customer_id' });

    if (insErr) {
      console.error(`  Error for ${customer.name}: ${insErr.message}`);
    }

    processed++;
    if (processed % 50 === 0) {
      process.stdout.write(`\r  Processed ${processed}/${customers.length}...`);
    }
  }

  console.log(`\n  Built insights for ${processed} customers`);

  // Print top customers summary
  const { data: topCustomers } = await supabase
    .from('customers')
    .select('name, email, total_reviews, average_rating, sentiment_summary')
    .order('total_reviews', { ascending: false })
    .limit(10);

  console.log('\n=== Top 10 Customers by Review Count ===\n');
  for (const c of topCustomers || []) {
    console.log(`  ${c.name || 'Anonymous'} (${c.email || 'no email'}) — ${c.total_reviews} reviews, avg ${c.average_rating}★, ${c.sentiment_summary}`);
  }

  console.log('\nNext step: node ask-claude.js "What are the most common complaints?"');
}

main().catch(console.error);
