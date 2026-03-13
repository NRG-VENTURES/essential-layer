require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Extract project ref from URL
const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const statements = [
  // Customers table
  `CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    judgeme_reviewer_id BIGINT UNIQUE,
    shopify_customer_id BIGINT,
    email TEXT,
    name TEXT,
    phone TEXT,
    accepts_marketing BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    total_reviews INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    first_review_date TIMESTAMPTZ,
    last_review_date TIMESTAMPTZ,
    sentiment_summary TEXT,
    top_products TEXT[] DEFAULT '{}',
    product_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Reviews table
  `CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    judgeme_review_id BIGINT UNIQUE,
    customer_id BIGINT REFERENCES customers(id),
    title TEXT,
    body TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    product_external_id BIGINT,
    product_title TEXT,
    product_handle TEXT,
    source TEXT,
    verified TEXT,
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    has_pictures BOOLEAN DEFAULT false,
    has_videos BOOLEAN DEFAULT false,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score NUMERIC(4,3),
    key_themes TEXT[] DEFAULT '{}',
    review_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Customer insights table
  `CREATE TABLE IF NOT EXISTS customer_insights (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) UNIQUE,
    overall_sentiment TEXT,
    loyalty_tier TEXT,
    product_categories TEXT[] DEFAULT '{}',
    positive_themes TEXT[] DEFAULT '{}',
    negative_themes TEXT[] DEFAULT '{}',
    sizing_notes TEXT,
    material_preferences TEXT,
    ai_summary TEXT,
    last_analyzed TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product_title ON reviews(product_title)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment)`,

  // RLS
  `ALTER TABLE customers ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE reviews ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE customer_insights ENABLE ROW LEVEL SECURITY`,

  // Policies
  `DO $$ BEGIN CREATE POLICY "Service role full access" ON customers FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Service role full access" ON reviews FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Service role full access" ON customer_insights FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

async function setup() {
  console.log('=== Setting up Supabase Database Schema ===\n');
  console.log(`Project: ${ref}\n`);

  // Test connection
  try {
    const result = execSync(
      `curl -s --max-time 10 "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"`,
      { maxBuffer: 1024 * 1024 }
    ).toString();
    if (result.includes('"swagger"')) {
      console.log('Connected to Supabase REST API!\n');
    }
  } catch {
    console.error('Cannot connect to Supabase. Check URL and key.');
    process.exit(1);
  }

  // Try to run SQL via the Supabase SQL API (available on newer projects)
  let sqlWorked = false;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const label = stmt.trim().substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`  [${i + 1}/${statements.length}] ${label}...`);

    // Try via postgrest RPC - won't work for DDL
    // Instead, use the Supabase Management API SQL endpoint
    const tmpFile = `/tmp/supabase-sql-${Date.now()}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify({ query: stmt }));

    try {
      const result = execSync(
        `curl -s --max-time 30 -X POST "${SUPABASE_URL}/pg/query" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" -H "Content-Type: application/json" -d @${tmpFile}`,
        { maxBuffer: 1024 * 1024 }
      ).toString();

      if (result.includes('error') && !result.includes('already exists') && !result.includes('duplicate_object')) {
        // Try alternative SQL execution endpoint
        const result2 = execSync(
          `curl -s --max-time 30 -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" -H "Content-Type: application/json" -d @${tmpFile}`,
          { maxBuffer: 1024 * 1024 }
        ).toString();

        if (result2.includes('error') && !result2.includes('already exists')) {
          console.log(' (needs manual setup)');
          continue;
        }
      }
      sqlWorked = true;
      console.log(' OK');
    } catch {
      console.log(' (needs manual setup)');
    }

    try { fs.unlinkSync(tmpFile); } catch {}
  }

  if (!sqlWorked) {
    // Save SQL for manual execution
    const fullSql = statements.map(s => s + ';').join('\n\n');
    fs.writeFileSync('setup.sql', fullSql);
    console.log('\n-----------------------------------------------');
    console.log('Could not auto-create tables (DDL requires direct DB access).');
    console.log('\nPlease run the SQL manually:');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Select your project');
    console.log('  3. Click "SQL Editor" in the left sidebar');
    console.log('  4. Click "New Query"');
    console.log('  5. Paste contents of setup.sql and click "Run"');
    console.log('\nSQL saved to: setup.sql');
    console.log('-----------------------------------------------');
    console.log('\nAfter running the SQL, run: node sync-reviews.js');
  } else {
    console.log('\nSchema created successfully!');
    console.log('Next: node sync-reviews.js');
  }
}

setup().catch(console.error);
