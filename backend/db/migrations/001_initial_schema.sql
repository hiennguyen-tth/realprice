-- RealPrice Initial Schema
-- PostgreSQL 15 + PostGIS

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE land_type_enum AS ENUM (
  'residential',
  'commercial',
  'agricultural',
  'industrial',
  'mixed_use'
);

CREATE TYPE legal_status_enum AS ENUM (
  'so_do',
  'so_hong',
  'giay_to_hop_le',
  'chua_co_giay_to',
  'dang_lam_so'
);

CREATE TYPE listing_status_enum AS ENUM (
  'pending_review',
  'active',
  'sold',
  'expired',
  'hidden'
);

CREATE TYPE listing_type_enum AS ENUM (
  'sale',
  'rent'
);

CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE lead_status_enum AS ENUM (
  'new',
  'contacted',
  'qualified',
  'closed'
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(200),
  email         VARCHAR(255) UNIQUE,
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  otp_code      VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- LANDS
-- ============================================================
CREATE TABLE lands (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  location            GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
                        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
                      ) STORED,
  address             TEXT NOT NULL,
  normalized_address  TEXT,
  ward                VARCHAR(200),
  district            VARCHAR(200),
  province            VARCHAR(200),
  area_m2             NUMERIC(12, 2),
  land_type           land_type_enum NOT NULL DEFAULT 'residential',
  legal_status        legal_status_enum NOT NULL DEFAULT 'chua_co_giay_to',
  frontage_m          NUMERIC(6, 2),
  alley_width_m       NUMERIC(6, 2),
  floors              SMALLINT,
  slug                VARCHAR(500),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lands_location      ON lands USING GIST(location);
CREATE INDEX idx_lands_district      ON lands(district);
CREATE INDEX idx_lands_ward          ON lands(ward);
CREATE INDEX idx_lands_land_type     ON lands(land_type);
CREATE INDEX idx_lands_norm_addr     ON lands USING GIN(normalized_address gin_trgm_ops);
CREATE INDEX idx_lands_slug          ON lands(slug);

-- ============================================================
-- LISTINGS
-- ============================================================
CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  land_id         UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES users(id),
  price           BIGINT NOT NULL,
  price_per_m2    BIGINT,
  area            NUMERIC(12, 2),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  source          VARCHAR(100) DEFAULT 'user',
  status          listing_status_enum NOT NULL DEFAULT 'pending_review',
  listing_type    listing_type_enum NOT NULL DEFAULT 'sale',
  images          JSONB NOT NULL DEFAULT '[]',
  contact_phone   VARCHAR(20),
  contact_name    VARCHAR(200),
  boosted         BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at TIMESTAMPTZ,
  view_count      INTEGER NOT NULL DEFAULT 0,
  favorite_count  INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_land_id      ON listings(land_id);
CREATE INDEX idx_listings_seller_id    ON listings(seller_id);
CREATE INDEX idx_listings_status       ON listings(status);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);
CREATE INDEX idx_listings_price        ON listings(price);
CREATE INDEX idx_listings_price_per_m2 ON listings(price_per_m2);
CREATE INDEX idx_listings_boosted      ON listings(boosted, boost_expires_at) WHERE boosted = true;
CREATE INDEX idx_listings_created_at   ON listings(created_at DESC);

-- Auto-calculate price_per_m2
CREATE OR REPLACE FUNCTION calc_price_per_m2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.area IS NOT NULL AND NEW.area > 0 THEN
    NEW.price_per_m2 := (NEW.price / NEW.area)::BIGINT;
  ELSE
    -- fallback to land area
    SELECT CASE WHEN l.area_m2 > 0 THEN (NEW.price / l.area_m2)::BIGINT ELSE NULL END
    INTO NEW.price_per_m2
    FROM lands l WHERE l.id = NEW.land_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listing_price_per_m2
  BEFORE INSERT OR UPDATE OF price, area ON listings
  FOR EACH ROW EXECUTE FUNCTION calc_price_per_m2();

-- ============================================================
-- PRICE HISTORY
-- ============================================================
CREATE TABLE price_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  land_id     UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  price       BIGINT NOT NULL,
  price_per_m2 BIGINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_land_id    ON price_history(land_id, recorded_at DESC);
CREATE INDEX idx_price_history_listing_id ON price_history(listing_id);

-- Trigger to record price history on listing price change
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.price <> NEW.price) THEN
    INSERT INTO price_history(listing_id, land_id, price, price_per_m2)
    VALUES(NEW.id, NEW.land_id, NEW.price, NEW.price_per_m2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_price_history
  AFTER INSERT OR UPDATE OF price ON listings
  FOR EACH ROW EXECUTE FUNCTION record_price_history();

-- ============================================================
-- AREA PRICE INDEX
-- ============================================================
CREATE TABLE area_price_index (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district              VARCHAR(200) NOT NULL,
  ward                  VARCHAR(200),
  avg_price_per_m2      BIGINT,
  median_price_per_m2   BIGINT,
  min_price_per_m2      BIGINT,
  max_price_per_m2      BIGINT,
  total_listings        INTEGER NOT NULL DEFAULT 0,
  price_change_30d      NUMERIC(6, 2),
  price_change_90d      NUMERIC(6, 2),
  heat_level            SMALLINT NOT NULL DEFAULT 1 CHECK (heat_level BETWEEN 1 AND 5),
  boundary              GEOGRAPHY(POLYGON, 4326),
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(district, ward)
);

CREATE INDEX idx_api_district ON area_price_index(district);
CREATE INDEX idx_api_ward     ON area_price_index(district, ward);
CREATE INDEX idx_api_boundary ON area_price_index USING GIST(boundary);

-- ============================================================
-- BANK VALUATIONS
-- ============================================================
CREATE TABLE bank_valuations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district          VARCHAR(200) NOT NULL,
  ward              VARCHAR(200),
  street_name       VARCHAR(500),
  land_type         land_type_enum NOT NULL,
  bank_name         VARCHAR(200) NOT NULL,
  valuation_per_m2  BIGINT NOT NULL,
  ltv_ratio         NUMERIC(4, 3) NOT NULL DEFAULT 0.700,
  max_loan_per_m2   BIGINT GENERATED ALWAYS AS ((valuation_per_m2 * ltv_ratio)::BIGINT) STORED,
  effective_from    DATE NOT NULL,
  effective_to      DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bv_district   ON bank_valuations(district);
CREATE INDEX idx_bv_ward       ON bank_valuations(district, ward);
CREATE INDEX idx_bv_land_type  ON bank_valuations(land_type);
CREATE INDEX idx_bv_bank       ON bank_valuations(bank_name);
CREATE INDEX idx_bv_effective  ON bank_valuations(effective_from, effective_to);

-- ============================================================
-- PRICE COMPARISONS
-- ============================================================
CREATE TABLE price_comparisons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id  VARCHAR(100),
  listing_ids UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pc_user_id    ON price_comparisons(user_id);
CREATE INDEX idx_pc_session_id ON price_comparisons(session_id);

-- ============================================================
-- SAVED LISTINGS (Favorites)
-- ============================================================
CREATE TABLE saved_listings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_sl_user_id ON saved_listings(user_id);

-- Maintain favorite_count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET favorite_count = favorite_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_favorite_count
  AFTER INSERT OR DELETE ON saved_listings
  FOR EACH ROW EXECUTE FUNCTION update_favorite_count();

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name        VARCHAR(200),
  phone       VARCHAR(20) NOT NULL,
  email       VARCHAR(255),
  message     TEXT,
  status      lead_status_enum NOT NULL DEFAULT 'new',
  source      VARCHAR(100) DEFAULT 'web',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_listing_id ON leads(listing_id);
CREATE INDEX idx_leads_phone      ON leads(phone);
CREATE INDEX idx_leads_status     ON leads(status);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  listing_id      UUID REFERENCES listings(id),
  amount          BIGINT NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'VND',
  payment_method  VARCHAR(50) NOT NULL,
  status          payment_status_enum NOT NULL DEFAULT 'pending',
  provider_ref    VARCHAR(500),
  provider_data   JSONB,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id    ON payments(user_id);
CREATE INDEX idx_payments_listing_id ON payments(listing_id);
CREATE INDEX idx_payments_status     ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================================
-- REBUILD AREA PRICE INDEX FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION rebuild_area_price_index()
RETURNS VOID AS $$
BEGIN
  -- Update or insert district-level aggregates
  INSERT INTO area_price_index(district, ward, avg_price_per_m2, median_price_per_m2,
    min_price_per_m2, max_price_per_m2, total_listings, heat_level, computed_at)
  SELECT
    l.district,
    NULL AS ward,
    AVG(li.price_per_m2)::BIGINT,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY li.price_per_m2)::BIGINT,
    MIN(li.price_per_m2),
    MAX(li.price_per_m2),
    COUNT(li.id)::INTEGER,
    CASE
      WHEN AVG(li.price_per_m2) >= 100000000 THEN 5
      WHEN AVG(li.price_per_m2) >= 60000000  THEN 4
      WHEN AVG(li.price_per_m2) >= 30000000  THEN 3
      WHEN AVG(li.price_per_m2) >= 15000000  THEN 2
      ELSE 1
    END,
    NOW()
  FROM lands l
  JOIN listings li ON li.land_id = l.id AND li.status = 'active'
  WHERE l.district IS NOT NULL
  GROUP BY l.district
  ON CONFLICT(district, ward) DO UPDATE SET
    avg_price_per_m2    = EXCLUDED.avg_price_per_m2,
    median_price_per_m2 = EXCLUDED.median_price_per_m2,
    min_price_per_m2    = EXCLUDED.min_price_per_m2,
    max_price_per_m2    = EXCLUDED.max_price_per_m2,
    total_listings      = EXCLUDED.total_listings,
    heat_level          = EXCLUDED.heat_level,
    computed_at         = EXCLUDED.computed_at;

  -- Ward-level aggregates
  INSERT INTO area_price_index(district, ward, avg_price_per_m2, median_price_per_m2,
    min_price_per_m2, max_price_per_m2, total_listings, heat_level, computed_at)
  SELECT
    l.district,
    l.ward,
    AVG(li.price_per_m2)::BIGINT,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY li.price_per_m2)::BIGINT,
    MIN(li.price_per_m2),
    MAX(li.price_per_m2),
    COUNT(li.id)::INTEGER,
    CASE
      WHEN AVG(li.price_per_m2) >= 100000000 THEN 5
      WHEN AVG(li.price_per_m2) >= 60000000  THEN 4
      WHEN AVG(li.price_per_m2) >= 30000000  THEN 3
      WHEN AVG(li.price_per_m2) >= 15000000  THEN 2
      ELSE 1
    END,
    NOW()
  FROM lands l
  JOIN listings li ON li.land_id = l.id AND li.status = 'active'
  WHERE l.district IS NOT NULL AND l.ward IS NOT NULL
  GROUP BY l.district, l.ward
  ON CONFLICT(district, ward) DO UPDATE SET
    avg_price_per_m2    = EXCLUDED.avg_price_per_m2,
    median_price_per_m2 = EXCLUDED.median_price_per_m2,
    min_price_per_m2    = EXCLUDED.min_price_per_m2,
    max_price_per_m2    = EXCLUDED.max_price_per_m2,
    total_listings      = EXCLUDED.total_listings,
    heat_level          = EXCLUDED.heat_level,
    computed_at         = EXCLUDED.computed_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lands_updated_at
  BEFORE UPDATE ON lands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comparisons_updated_at
  BEFORE UPDATE ON price_comparisons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
