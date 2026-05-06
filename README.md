# RealPrice — So sánh giá bất động sản Việt Nam

> **RealPrice** is Vietnam's first data-driven real estate price comparison platform, built for the Vietnamese market the way Zillow is built for the US — but with heatmaps, bank valuation data, and street-level price indexing that actually reflect how Vietnamese people search for and buy property.

---

## Competitive Advantage vs Zillow

| Feature | Zillow (US) | RealPrice (VN) |
|---|---|---|
| Market | US suburbs, MLS-fed | Vietnam urban + suburban, crowd + bank-sourced |
| Bank valuation | No | Yes — per-land bank pricing vs market |
| Heatmap granularity | Zip code | Street / phường level |
| Language / UX | English | Vietnamese-first |
| Price unit | $/sqft | VND/m² (tri/m²) |
| Land type support | House, condo | Đất nền, nhà phố, chung cư, biệt thự |
| Mobile | App + web | React Native + Next.js PWA |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌─────────────────┐   ┌─────────────────┐                      │
│  │  Next.js 14 Web │   │  React Native   │                      │
│  │  (App Router)   │   │  Mobile App     │                      │
│  │  SSR + ISR SEO  │   │  Expo + Maps    │                      │
│  └────────┬────────┘   └────────┬────────┘                      │
└───────────┼────────────────────┼─────────────────────────────── ┘
            │  HTTPS / REST      │
┌───────────▼────────────────────▼─────────────────────────────── ┐
│                        API GATEWAY                              │
│           (NestJS / FastAPI — /api/v1/*)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Lands   │ │Listings  │ │Heatmap   │ │  Bank Valuations │   │
│  │  Service │ │ Service  │ │ Service  │ │     Service      │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
└───────┼────────────┼────────────┼─────────────────┼──────────── ┘
        │            │            │                 │
┌───────▼────────────▼────────────▼─────────────────▼──────────── ┐
│                      DATA LAYER                                  │
│   ┌──────────────────────┐     ┌──────────────────────────────┐  │
│   │  PostgreSQL 15       │     │  Redis 7                     │  │
│   │  + PostGIS 3.3       │     │  (Cache, sessions, queues)   │  │
│   │  (Spatial queries)   │     └──────────────────────────────┘  │
│   └──────────────────────┘                                        │
│   ┌──────────────────────┐     ┌──────────────────────────────┐  │
│   │  S3 / R2             │     │  Elasticsearch (search)      │  │
│   │  (Images, documents) │     └──────────────────────────────┘  │
│   └──────────────────────┘                                        │
└───────────────────────────────────────────────────────────────── ┘
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Mapbox token
- (Optional) AWS S3 / Cloudflare R2 bucket

### 1. Start Infrastructure

```bash
# Copy env template
cp .env.example .env
# Edit .env with your secrets

# Start PostgreSQL + Redis
docker compose up -d

# Verify health
docker compose ps
```

### 2. Backend API

```bash
cd backend
npm install
npm run migration:run
npm run seed          # seed sample lands for Hanoi/HCMC
npm run dev           # http://localhost:4000
```

### 3. Web App

```bash
cd web
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_MAPBOX_TOKEN, NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL
npm run dev           # http://localhost:3000
```

> NOTE: In production, `NEXT_PUBLIC_API_URL` must point to the deployed backend API base URL, e.g. `https://api.realprice.vn/api/v1`.
> If the web app and API share the same origin, the app can also use `/api/v1`.

### 4. Mobile App

```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go or run on simulator
```

---

## Environment Variables

### Web (`web/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token | `pk.eyJ1IjoiLi4uIn0...` |
| `NEXTAUTH_URL` | Full URL of Next.js app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | `openssl rand -hex 32` |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | Public CDN base for images | `https://cdn.realprice.vn` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID | `G-XXXXXXXXXX` |

### Backend (`.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://realprice:secret@localhost:5432/realprice_db` |
| `REDIS_URL` | Redis connection string | `redis://:secret@localhost:6379` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `AWS_REGION` | S3 region | `ap-southeast-1` |
| `AWS_BUCKET` | S3 bucket name | `realprice-media` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `SMTP_HOST` | Email server | `smtp.sendgrid.net` |
| `SMTP_USER` | Email user | `apikey` |
| `SMTP_PASS` | Email password | `SG.xxx` |

---

## API Endpoint Reference

### Lands

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/lands?bbox=lng1,lat1,lng2,lat2` | Fetch land markers within bounding box |
| `GET` | `/lands/:id` | Get single land detail |
| `GET` | `/lands/:id/price-history` | 6-month price history |
| `GET` | `/lands/:id/bank-valuations` | Bank valuations for a land |
| `GET` | `/lands/district/:district` | District overview & stats |

### Listings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/listings?landId=&page=&limit=` | Paginated listings for land |
| `GET` | `/listings/:id` | Single listing detail |
| `POST` | `/listings` | Create new listing (auth required) |
| `PUT` | `/listings/:id` | Update listing (auth + owner) |
| `DELETE` | `/listings/:id` | Delete listing (auth + owner) |
| `POST` | `/listings/presigned-url` | Get S3 presigned upload URL |

### Search

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/search?q=&type=&minPrice=&maxPrice=&minArea=&maxArea=&listingType=&sortBy=&page=` | Full-text + filter search across listings and lands |

## Search page `/tim-kiem`

- The page calls the backend `/api/v1/search` endpoint.
- It requires `q` to be at least 2 characters.
- Filters supported by the page are:
  - `listingType` (property category)
  - `minPrice`, `maxPrice`
  - `minArea`, `maxArea`
  - `sortBy`
- The backend search now matches `title`, `address`, `street`, `district`, and `ward`.

### Troubleshooting

- If the page shows no results, verify `NEXT_PUBLIC_API_URL` is set correctly in production.
- If the app is on the same host as the backend, `NEXT_PUBLIC_API_URL=/api/v1` is valid.
- For debugging, open browser devtools Network tab and confirm `/search?q=...` returns `200` with `listings`.

### Comparison

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/comparison` | Create comparison session |
| `GET` | `/comparison/:id` | Get comparison result |

### Heatmap

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/heatmap?bbox=` | Heatmap polygons within bbox |
| `GET` | `/heatmap/district/:district` | District heatmap data |

### Bank Valuations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/bank-valuations?district=` | All bank valuations for district |
| `GET` | `/bank-valuations/:id` | Single bank valuation |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/refresh` | Refresh JWT token |
| `GET` | `/auth/me` | Current user profile |
| `PUT` | `/auth/me` | Update profile |

### Leads

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/leads` | Submit contact lead for listing |

---

## Database Setup

### PostgreSQL + PostGIS Schema

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for full-text search

-- Lands table
CREATE TABLE lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT,
  location GEOMETRY(Point, 4326) NOT NULL,
  boundary GEOMETRY(Polygon, 4326),
  min_price BIGINT,
  max_price BIGINT,
  avg_price BIGINT,
  price_per_m2 BIGINT,
  total_listings INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_lands_location ON lands USING GIST (location);
CREATE INDEX idx_lands_district ON lands (district);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  area DECIMAL(10,2) NOT NULL,
  price_per_m2 BIGINT GENERATED ALWAYS AS (price / NULLIF(area::BIGINT, 0)) STORED,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('dat_nen','nha_pho','chung_cu','biet_thu','van_phong')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','expired','pending')),
  images TEXT[],
  address TEXT NOT NULL,
  location GEOMETRY(Point, 4326),
  contact_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_listings_land_id ON listings (land_id);
CREATE INDEX idx_listings_location ON listings USING GIST (location);
CREATE INDEX idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
  avg_price BIGINT NOT NULL,
  price_per_m2 BIGINT NOT NULL,
  recorded_at DATE NOT NULL,
  source TEXT DEFAULT 'system'
);
CREATE INDEX idx_price_history_land_id_date ON price_history (land_id, recorded_at DESC);

-- Bank valuations
CREATE TABLE bank_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  valuation_price BIGINT NOT NULL,
  ltv_ratio DECIMAL(5,2) NOT NULL,
  max_loan BIGINT GENERATED ALWAYS AS ((valuation_price * ltv_ratio / 100)::BIGINT) STORED,
  interest_rate DECIMAL(5,2),
  valuation_date DATE NOT NULL,
  notes TEXT
);

-- Heatmap areas (pre-computed, refreshed nightly)
CREATE TABLE heatmap_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  boundary GEOMETRY(Polygon, 4326) NOT NULL,
  avg_price BIGINT NOT NULL,
  price_level INT NOT NULL CHECK (price_level BETWEEN 1 AND 5),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_heatmap_boundary ON heatmap_areas USING GIST (boundary);
```

---

## Deployment Guide

### Docker (Production)

```bash
# Build images
docker build -t realprice/web:latest ./web
docker build -t realprice/api:latest ./backend

# Use production compose
docker compose -f docker-compose.prod.yml up -d
```

### Vercel (Web)

```bash
cd web
vercel --prod
# Set env vars in Vercel dashboard
```

### Railway / Render (Backend)

```bash
# Connect GitHub repo, select backend/ directory
# Add environment variables
# Enable PostgreSQL addon (includes PostGIS)
```

### AWS / GCP

- **EC2/GCE**: Run Docker Compose on VM
- **RDS**: Use `postgres:15` with PostGIS extension
- **ElastiCache / MemoryStore**: Redis 7
- **CloudFront / Cloud CDN**: Static assets + image CDN

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the coding standards:
   - TypeScript strict mode everywhere
   - SOLID principles — see architecture notes
   - Components max 200 lines; extract sub-components freely
   - All prices in VND (integer, no decimals)
   - All coordinates: `[longitude, latitude]` (GeoJSON order)
4. Write tests for lib functions
5. Run `npm run type-check && npm run lint` before PR
6. Submit PR with description of changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Mobile | React Native, Expo, react-native-maps |
| Maps | Mapbox GL JS, react-map-gl, deck.gl |
| State | Zustand 4, TanStack Query 5 |
| Charts | Recharts 2 |
| Forms | react-hook-form + Zod |
| Auth | next-auth v4 (JWT) |
| HTTP | Axios |
| Database | PostgreSQL 15 + PostGIS 3.3 |
| Cache | Redis 7 |
| Storage | AWS S3 / Cloudflare R2 |
| Search | PostgreSQL pg_trgm / Elasticsearch |
| Deployment | Vercel (web), Railway (API), Docker |

---

*Made with ❤️ for the Vietnamese real estate market.*
