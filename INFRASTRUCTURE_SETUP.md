# RealPrice — Infrastructure Setup Guide

## Tổng hợp: Free vs Cần đăng ký/Trả phí

### ✅ HOÀN TOÀN FREE (cài local, không cần đăng ký)

| Service | Dùng cho | Cách setup |
|---------|----------|------------|
| PostgreSQL 15 + PostGIS | Database chính | Docker Compose có sẵn |
| Redis 7 | Cache + Job Queue | Docker Compose có sẵn |
| Node.js 18+ | Backend runtime | Cài từ nodejs.org |
| Next.js / React Native | Frontend | `npm install` |

### 🔐 FREE nhưng cần đăng ký tài khoản

| Service | Dùng cho | Giới hạn free | Link đăng ký |
|---------|----------|---------------|-------------|
| **Mapbox** | Bản đồ tile + geocoding | 50,000 map loads/tháng | mapbox.com |
| **Supabase** | PostgreSQL managed (thay thế tự host) | 500MB, 2 projects | supabase.com |
| **Cloudinary** | Image hosting (thay S3) | 25GB storage, 25GB bandwidth | cloudinary.com |
| **Upstash Redis** | Redis managed | 10,000 req/ngày | upstash.com |
| **Vercel** | Deploy Next.js web | Unlimited (Hobby plan) | vercel.com |
| **Render** | Deploy Node.js backend | 750 giờ/tháng (ngủ sau 15') | render.com |
| **Railway** | Deploy backend (không sleep) | $5 credit miễn phí | railway.app |

### 💳 CẦN TRẢ PHÍ (hoặc free tier rất hạn chế)

| Service | Dùng cho | Giá tham khảo |
|---------|----------|---------------|
| **AWS S3** | Image storage (production) | ~$0.023/GB/tháng |
| **Mapbox (production)** | Nếu vượt 50k loads/tháng | $0.5/1000 loads |
| **eSMS / Vietguys** | SMS OTP | ~200đ/SMS |
| **VNPay** | Thanh toán boost tin | Đăng ký merchant |
| **MoMo** | Thanh toán boost tin | Đăng ký merchant |
| **Google Ads / Facebook Ads** | Quảng cáo | Tự định ngân sách |

---

## Bước 1: Setup Database (Local Development)

### 1.1 Cài Docker Desktop
```bash
# Mac
brew install --cask docker

# Hoặc tải từ: https://www.docker.com/products/docker-desktop
```

### 1.2 Khởi động PostgreSQL + Redis
```bash
cd /path/to/realprice
docker-compose up -d

# Kiểm tra
docker-compose ps
# Kết quả mong muốn:
# realprice-postgres  running  0.0.0.0:5432->5432/tcp
# realprice-redis     running  0.0.0.0:6379->6379/tcp
```

### 1.3 Chạy DB migrations
```bash
cd backend
cp .env.example .env          # tạo file env
npm run db:migrate            # tạo schema
npm run db:seed               # seed bank valuations

# Seed data mẫu Đà Nẵng
node scripts/seed-da-nang.js
```

### 1.4 Kiểm tra DB
```bash
psql postgresql://realprice_user:realprice_local@localhost:5432/realprice
\dt   # xem danh sách bảng
SELECT COUNT(*) FROM lands;
SELECT COUNT(*) FROM listings;
\q
```

---

## Bước 2: Setup Mapbox (Bản đồ)

### 2.1 Đăng ký Mapbox (miễn phí)
1. Vào https://account.mapbox.com/auth/signup/
2. Tạo tài khoản (email + password)
3. Vào **Tokens** → **Create a token**
4. Đặt tên: `realprice-dev`, scope: `styles:read`, `tiles:read`
5. Copy token (bắt đầu bằng `pk.eyJ1...`)

### 2.2 Cấu hình token
```bash
# web/.env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...your_token_here

# mobile/src/screens/MapScreen.tsx — line 19
MapboxGL.setAccessToken('pk.eyJ1...your_token_here');
```

### 2.3 Thay thế Mapbox bằng MapLibre (100% free, không cần đăng ký)

Nếu không muốn dùng Mapbox, thay thế bằng MapLibre GL + OpenStreetMap tiles:

```bash
cd web
npm install maplibre-gl react-map-gl@8
```

Thay `mapStyle` trong `MapView.tsx`:
```typescript
// Thay
mapStyle="mapbox://styles/mapbox/light-v11"

// Bằng (OpenStreetMap, hoàn toàn free)
mapStyle="https://tiles.openfreemap.org/styles/liberty"
// Hoặc: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
```

---

## Bước 3: Setup Image Storage

### 3.1 Option A — Cloudinary (FREE, đơn giản hơn S3)
1. Đăng ký: https://cloudinary.com/
2. Vào Dashboard → Copy **Cloud Name**, **API Key**, **API Secret**
3. Cập nhật backend `.env`:
```env
IMAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3.2 Option B — AWS S3 (production grade)
1. Đăng ký AWS: https://aws.amazon.com/
2. Tạo S3 bucket: `realprice-images-prod`, region: `ap-southeast-1`
3. Tạo IAM user với quyền `s3:PutObject`, `s3:GetObject`
4. Cập nhật backend `.env`:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=realprice-images-prod
```

---

## Bước 4: Chạy ứng dụng

### 4.1 Backend
```bash
cd backend
npm install
cp .env.example .env
# Sửa .env với đúng DB URL, JWT secret, etc.
npm run dev
# Backend chạy tại: http://localhost:3000
```

### 4.2 Web (Next.js)
```bash
cd web
npm install
cp .env.local.example .env.local
# Sửa NEXT_PUBLIC_MAPBOX_TOKEN
npm run dev
# Web chạy tại: http://localhost:3001
```

### 4.3 Mobile (React Native + Expo)
```bash
cd mobile
npm install
# Sửa MapboxGL.setAccessToken() trong MapScreen.tsx
npx expo start
# Scan QR code bằng Expo Go app
```

---

## Bước 5: Setup Crawler (Crawl data tự động)

### 5.1 Cấu hình crawler
```env
# backend/.env
CRAWLER_ENABLED=true
CRAWLER_CRON=0 3 * * *           # Chạy lúc 03:00 mỗi ngày
CRAWLER_LOCATIONS=Hải Châu,Đà Nẵng;Sơn Trà,Đà Nẵng;Ngũ Hành Sơn,Đà Nẵng
CRAWLER_MAX_PAGES=5              # Số trang mỗi nguồn
CRAWLER_DELAY_MS=2000            # Delay giữa requests (ms)
CRAWLER_NHATOT_ENABLED=true
CRAWLER_BDS_ENABLED=true
```

### 5.2 Cài cheerio (cho HTML scraping)
```bash
cd backend
npm install cheerio
```

### 5.3 Trigger crawl thủ công
```bash
curl -X POST http://localhost:3000/api/admin/crawler/trigger
# Response: {"success":true,"jobId":"..."}
```

### 5.4 Xem kết quả crawl
```bash
curl http://localhost:3000/api/admin/crawler/stats
curl http://localhost:3000/api/admin/crawler/listings?district=Hải+Châu
```

---

## Bước 6: Deploy Production

### Option A — Vercel + Railway (gần như free)

**Web (Vercel):**
```bash
npm install -g vercel
cd web
vercel --prod
# Thêm env vars trong Vercel dashboard
```

**Backend (Railway):**
1. Vào https://railway.app → New Project → Deploy from GitHub
2. Chọn thư mục `backend`
3. Thêm PostgreSQL + Redis plugin
4. Set env vars

### Option B — VPS (Tiết kiệm chi phí hơn khi scale)

```bash
# Ubuntu 22.04 VPS
sudo apt install -y docker docker-compose nginx certbot

# Clone repo, setup .env files
git clone https://github.com/your-org/realprice.git
cd realprice
docker-compose -f docker-compose.prod.yml up -d

# Setup nginx reverse proxy + SSL
sudo certbot --nginx -d realprice.vn -d api.realprice.vn
```

---

## Bước 7: SEO & Ads

### Google Analytics 4
1. Vào https://analytics.google.com → Tạo property mới
2. Copy **Measurement ID** (G-XXXXXXXXXX)
3. Cập nhật `web/.env.local`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Google AdSense
1. Đăng ký: https://www.google.com/adsense/
2. Verify domain ownership
3. Copy Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
4. Cập nhật `web/.env.local`:
```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

### Google Search Console
1. Vào https://search.google.com/search-console
2. Add property → URL prefix → `https://realprice.vn`
3. Verify bằng HTML meta tag hoặc DNS
4. Submit sitemap: `https://realprice.vn/sitemap.xml`

---

## Checklist trước khi Go Live

- [ ] `JWT_SECRET` được đổi thành chuỗi ngẫu nhiên 64 ký tự
- [ ] `NEXTAUTH_SECRET` đã set
- [ ] Database ở production (không phải localhost)
- [ ] Redis ở production
- [ ] Mapbox token production (restrict domain)
- [ ] S3 bucket với public read policy đúng
- [ ] SMS provider (eSMS) đã đăng ký và test
- [ ] SSL certificate đã cài (HTTPS)
- [ ] Rate limiting đã bật
- [ ] CORS origins chỉ cho phép domain production
- [ ] Google Analytics đã kết nối
- [ ] Sitemap tại `/sitemap.xml` hoạt động
- [ ] robots.txt đã cấu hình

---

## Tóm tắt chi phí ước tính (khi start)

| Giai đoạn | Chi phí/tháng | Ghi chú |
|-----------|---------------|---------|
| Development | $0 | Tất cả local |
| Soft launch (<1K user) | $0–$5 | Vercel + Railway free tier |
| Growth (1K–10K user) | $20–$50 | VPS $15 + S3 $5 + SMS ~$10 |
| Scale (10K+ user) | $100–$300 | Dedicated server + CDN |
