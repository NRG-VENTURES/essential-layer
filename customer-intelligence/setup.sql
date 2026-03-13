-- Customers table: one row per unique reviewer
CREATE TABLE IF NOT EXISTS customers (
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
);

-- Reviews table: all JudgeMe reviews
CREATE TABLE IF NOT EXISTS reviews (
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
);

-- Customer insights: AI-generated summaries per customer
CREATE TABLE IF NOT EXISTS customer_insights (
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
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_title ON reviews(product_title);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_insights ENABLE ROW LEVEL SECURITY;

-- Policies (service role gets full access)
DO $$ BEGIN
  CREATE POLICY "Service role full access" ON customers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access" ON reviews FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access" ON customer_insights FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
