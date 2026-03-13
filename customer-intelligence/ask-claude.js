require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

async function getRelevantData(question) {
  const q = question.toLowerCase();

  let customers = [];
  let reviews = [];
  let insights = [];

  // Check if asking about a specific customer
  const emailMatch = q.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+)/);
  const nameMatch = q.match(/(?:about|for|customer|who is|tell me about|profile)\s+["']?([a-z]+ ?[a-z]*)/i);

  if (emailMatch) {
    customers = runSQL(`SELECT * FROM customers WHERE email ILIKE '%${emailMatch[1].replace(/'/g, "''")}%' LIMIT 5`);
  } else if (nameMatch && nameMatch[1].length > 2) {
    const name = nameMatch[1].trim().replace(/'/g, "''");
    customers = runSQL(`SELECT * FROM customers WHERE name ILIKE '%${name}%' LIMIT 10`);
  }

  // Get their reviews and insights
  if (customers.length > 0 && customers.length <= 10) {
    const ids = customers.map(c => c.id).join(',');
    reviews = runSQL(`SELECT * FROM reviews WHERE customer_id IN (${ids}) ORDER BY review_date DESC LIMIT 50`);
    insights = runSQL(`SELECT * FROM customer_insights WHERE customer_id IN (${ids})`);
  }

  // For general questions, get aggregate data
  if (customers.length === 0) {
    // Overall stats
    const stats = runSQL(`
      SELECT COUNT(*) as total_reviews,
        COUNT(DISTINCT customer_id) as total_customers,
        AVG(rating)::numeric(3,2) as avg_rating,
        COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
        COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
      FROM reviews
    `);

    // Loyalty tiers
    const tiers = runSQL(`SELECT loyalty_tier, COUNT(*) as count FROM customer_insights GROUP BY loyalty_tier ORDER BY count DESC`);

    if (q.includes('complaint') || q.includes('negative') || q.includes('bad') || q.includes('issue') || q.includes('problem') || q.includes('unhappy') || q.includes('improve')) {
      reviews = runSQL(`SELECT r.*, c.name, c.email FROM reviews r JOIN customers c ON c.id = r.customer_id WHERE r.sentiment = 'negative' ORDER BY r.review_date DESC LIMIT 40`);
    } else if (q.includes('happy') || q.includes('positive') || q.includes('love') || q.includes('best') || q.includes('loyal') || q.includes('champion')) {
      reviews = runSQL(`SELECT r.*, c.name, c.email FROM reviews r JOIN customers c ON c.id = r.customer_id WHERE r.sentiment = 'positive' ORDER BY r.review_date DESC LIMIT 40`);
    } else if (q.includes('product') || q.includes('bra') || q.includes('underwear') || q.includes('shirt') || q.includes('sock') || q.includes('top seller') || q.includes('popular')) {
      reviews = runSQL(`SELECT product_title, COUNT(*) as review_count, AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) FILTER (WHERE sentiment='positive') as positive, COUNT(*) FILTER (WHERE sentiment='negative') as negative FROM reviews GROUP BY product_title ORDER BY review_count DESC LIMIT 30`);
    } else if (q.includes('sizing') || q.includes('fit') || q.includes('size')) {
      reviews = runSQL(`SELECT r.body, r.rating, r.product_title, c.name FROM reviews r JOIN customers c ON c.id=r.customer_id WHERE 'sizing' = ANY(r.key_themes) ORDER BY r.review_date DESC LIMIT 30`);
    } else if (q.includes('allerg') || q.includes('sensitive') || q.includes('eczema') || q.includes('rash')) {
      reviews = runSQL(`SELECT r.body, r.rating, r.product_title, c.name FROM reviews r JOIN customers c ON c.id=r.customer_id WHERE 'allergies' = ANY(r.key_themes) ORDER BY r.review_date DESC LIMIT 30`);
    } else {
      reviews = runSQL(`SELECT r.*, c.name, c.email FROM reviews r JOIN customers c ON c.id = r.customer_id ORDER BY r.review_date DESC LIMIT 30`);
    }

    // Top customers
    const topCusts = runSQL(`SELECT c.*, ci.loyalty_tier, ci.ai_summary FROM customers c JOIN customer_insights ci ON ci.customer_id = c.id ORDER BY c.total_reviews DESC LIMIT 10`);
    customers = topCusts;

    // Add stats as context
    customers.push({ _stats: true, ...stats[0], loyalty_tiers: tiers });
  }

  return { customers, reviews, insights };
}

async function askClaude(question) {
  console.log(`\nQuestion: ${question}\n`);
  console.log('Fetching relevant data from Supabase...');

  const { customers, reviews, insights } = await getRelevantData(question);
  console.log(`  Found ${customers.length} customer records, ${reviews.length} reviews, ${insights.length} insights\n`);

  const context = `You are a customer intelligence analyst for Cottonique, a hypoallergenic organic clothing brand by Essential Layer Inc. You help the team understand their customers based on JudgeMe review data stored in Supabase.

Here is the relevant data:

CUSTOMER PROFILES:
${JSON.stringify(customers, null, 2)}

REVIEWS:
${JSON.stringify(reviews.map(r => ({
    customer_id: r.customer_id,
    name: r.name,
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

Answer the user's question based on this data. Be specific — cite customer names, product names, and review details where relevant. Provide actionable business insights when possible.`;

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
  console.log('Usage: node ask-claude.js "Your question about customers"\n');
  console.log('Examples:');
  console.log('  node ask-claude.js "What are the most common complaints?"');
  console.log('  node ask-claude.js "Tell me about customer Connie"');
  console.log('  node ask-claude.js "Which customers are most loyal?"');
  console.log('  node ask-claude.js "What products get the best reviews?"');
  console.log('  node ask-claude.js "Summarize sizing issues"');
  console.log('  node ask-claude.js "Who are the unhappy customers and why?"');
  console.log('  node ask-claude.js "What do customers say about allergies?"');
  process.exit(0);
}

askClaude(question).catch(console.error);
