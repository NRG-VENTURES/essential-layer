require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getRelevantData(question) {
  const q = question.toLowerCase();

  // Determine what data to fetch based on the question
  let customers = [];
  let reviews = [];
  let insights = [];

  // Check if asking about a specific customer
  const nameMatch = q.match(/(?:about|for|customer|who is|tell me about)\s+["']?([a-z]+ ?[a-z]*)/i);
  const emailMatch = q.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+)/);

  if (emailMatch) {
    const { data } = await supabase.from('customers').select('*').ilike('email', `%${emailMatch[1]}%`).limit(5);
    customers = data || [];
  } else if (nameMatch && nameMatch[1].length > 2) {
    const name = nameMatch[1].trim();
    const { data } = await supabase.from('customers').select('*').ilike('name', `%${name}%`).limit(10);
    customers = data || [];
  }

  // If we found specific customers, get their reviews and insights
  if (customers.length > 0 && customers.length <= 10) {
    const ids = customers.map(c => c.id);
    const { data: revs } = await supabase.from('reviews').select('*').in('customer_id', ids).order('review_date', { ascending: false }).limit(50);
    reviews = revs || [];
    const { data: ins } = await supabase.from('customer_insights').select('*').in('customer_id', ids);
    insights = ins || [];
  }

  // For general questions, get aggregate data
  if (customers.length === 0) {
    // Get overall stats
    const { count: totalCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const { count: totalReviews } = await supabase.from('reviews').select('*', { count: 'exact', head: true });

    // Get rating distribution
    const { data: ratingDist } = await supabase.from('reviews').select('rating');
    const ratings = {};
    for (const r of (ratingDist || [])) {
      ratings[r.rating] = (ratings[r.rating] || 0) + 1;
    }

    // Get sentiment distribution
    const { data: sentDist } = await supabase.from('reviews').select('sentiment');
    const sentiments = {};
    for (const r of (sentDist || [])) {
      sentiments[r.sentiment] = (sentiments[r.sentiment] || 0) + 1;
    }

    // For complaint/negative questions, get negative reviews
    if (q.includes('complaint') || q.includes('negative') || q.includes('bad') || q.includes('issue') || q.includes('problem') || q.includes('unhappy') || q.includes('improve')) {
      const { data: negRevs } = await supabase.from('reviews').select('*').eq('sentiment', 'negative').order('review_date', { ascending: false }).limit(30);
      reviews = negRevs || [];
    }
    // For positive/happy questions
    else if (q.includes('happy') || q.includes('positive') || q.includes('love') || q.includes('best') || q.includes('loyal') || q.includes('champion')) {
      const { data: posRevs } = await supabase.from('reviews').select('*').eq('sentiment', 'positive').order('review_date', { ascending: false }).limit(30);
      reviews = posRevs || [];
    }
    // For product-specific questions
    else if (q.includes('product') || q.includes('bra') || q.includes('underwear') || q.includes('shirt') || q.includes('sock')) {
      const { data: prodRevs } = await supabase.from('reviews').select('*').order('review_date', { ascending: false }).limit(50);
      reviews = prodRevs || [];
    }
    // General: get a sample
    else {
      const { data: sampleRevs } = await supabase.from('reviews').select('*').order('review_date', { ascending: false }).limit(30);
      reviews = sampleRevs || [];
    }

    // Get top customers
    const { data: topCusts } = await supabase.from('customers').select('*').order('total_reviews', { ascending: false }).limit(10);
    customers = topCusts || [];

    // Get insights for top customers
    if (customers.length > 0) {
      const ids = customers.map(c => c.id);
      const { data: ins } = await supabase.from('customer_insights').select('*').in('customer_id', ids);
      insights = ins || [];
    }

    // Add stats to context
    customers.push({
      _stats: true,
      total_customers: totalCustomers,
      total_reviews: totalReviews,
      rating_distribution: ratings,
      sentiment_distribution: sentiments
    });
  }

  return { customers, reviews, insights };
}

async function askClaude(question) {
  console.log(`\nQuestion: ${question}\n`);
  console.log('Fetching relevant data from Supabase...');

  const { customers, reviews, insights } = await getRelevantData(question);

  console.log(`  Found ${customers.length} customer records, ${reviews.length} reviews, ${insights.length} insights\n`);

  const context = `You are a customer intelligence analyst for Cottonique, an organic hypoallergenic clothing brand by Essential Layer Inc. You have access to customer data from JudgeMe reviews stored in Supabase.

Here is the relevant data:

CUSTOMER PROFILES:
${JSON.stringify(customers, null, 2)}

REVIEWS:
${JSON.stringify(reviews.map(r => ({
    customer_id: r.customer_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    product: r.product_title,
    sentiment: r.sentiment,
    themes: r.key_themes,
    date: r.review_date
  })), null, 2)}

CUSTOMER INSIGHTS:
${JSON.stringify(insights, null, 2)}

Answer the user's question based on this data. Be specific, cite customer names and review details where relevant. Provide actionable insights when possible.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      { role: 'user', content: `${context}\n\nQuestion: ${question}` }
    ]
  });

  const answer = response.content[0].text;
  console.log('--- Claude\'s Analysis ---\n');
  console.log(answer);
  console.log('\n-------------------------');
}

const question = process.argv.slice(2).join(' ');
if (!question) {
  console.log('Usage: node ask-claude.js "Your question about customers"');
  console.log('\nExamples:');
  console.log('  node ask-claude.js "What are the most common complaints?"');
  console.log('  node ask-claude.js "Tell me about customer Cynthia"');
  console.log('  node ask-claude.js "Which customers are most loyal?"');
  console.log('  node ask-claude.js "What products get the best reviews?"');
  console.log('  node ask-claude.js "Summarize sizing issues"');
  process.exit(0);
}

askClaude(question).catch(console.error);
