# RealPrice — So sánh giá bất động sản Việt Nam

## Tổng quan

RealPrice là nền tảng so sánh giá bất động sản dành cho thị trường Việt Nam, tập trung vào:
- tìm kiếm theo **vị trí**, **giá**, **diện tích**, **loại hình**
- hiển thị **heatmap** và **giá ngân hàng**
- hỗ trợ **web + mobile**
- chatbot tiếng Việt với **fallback mock mode** khi không có OpenAI key

---

## Kiến trúc tổng thể

```
CLIENT
  ├── Next.js 14 Web
  └── React Native Mobile
      │
      ▼
API
  ├── Backend Express.js
  ├── /api/v1/chat
  ├── /api/v1/search
  ├── /api/v1/lands
  ├── /api/v1/listings
  └── /api/v1/heatmap
      │
      ▼
DATA
  ├── PostgreSQL 15 + PostGIS
  ├── Redis 7
  ├── S3 / R2
  └── Elasticsearch / pg_trgm
```

---

## Quick Start

### Yêu cầu
- Node.js 20+
- Docker + Docker Compose
- Mapbox token
- (Optional) AWS S3 / Cloudflare R2 bucket

### 1. Khởi động cơ sở hạ tầng

```bash
cp .env.example .env
# chỉnh .env với các giá trị cần thiết

docker compose up -d

docker compose ps
```

### 2. Backend

```bash
cd backend
npm install
npm run migration:run
npm run seed
npm run dev
```

### 3. Web

```bash
cd web
npm install
cp .env.local.example .env.local
# thiết lập NEXT_PUBLIC_MAPBOX_TOKEN, NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL
npm run dev
```

### 4. Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## Biến môi trường chính

### Web (`web/.env.local`)

| Variable | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | `pk.xxxx` |
| `NEXTAUTH_URL` | URL ứng dụng | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret cho auth | `openssl rand -hex 32` |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | CDN base | `https://cdn.realprice.vn` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `G-XXXXXXXXXX` |

### Backend (`.env`)

| Variable | Mô tả | Ví dụ |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/realprice_db` |
| `REDIS_URL` | Redis connection | `redis://:password@localhost:6379` |
| `JWT_SECRET` | JWT secret | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `OPENAI_API_KEY` | OpenAI secret key | `sk-...` |
| `OPENAI_MODEL` | OpenAI model | `gpt-3.5-turbo` |

---

## Logic chính đã triển khai

### 1. Search và filter

- Search backend hiện tìm theo `title`, `address`, `district`, `ward`, `description`, `slug`
- Hỗ trợ lọc theo property type:
  - `dat_nen`, `nha_pho`, `chung_cu`, `biet_thu`, `van_phong`
- Hỗ trợ tham số:
  - `q`, `listingType`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `sortBy`, `page`
- `sortBy` hỗ trợ:
  - `price_asc`, `price_desc`, `area_asc`, `area_desc`, `newest`
- Fix featured area / district slug logic để click `Khu vực nổi bật` trả về đúng dữ liệu

### 2. Chatbot AI

- Backend service: `backend/src/modules/chat/chat.service.js`
- Frontend chat UI: `web/src/components/chat/ChatBot.tsx`
- API routes:
  - `POST /api/v1/chat`
  - `POST /api/v1/chat/search`
- Hoạt động với hai chế độ:
  - `OPENAI_API_KEY` tồn tại → dùng GPT-3.5-turbo
  - `OPENAI_API_KEY` rỗng → dùng mock responses để thử nghiệm ngay

### 3. Mock mode chatbot

Mock mode hiện nhận diện:
- Vị trí: `Bình Thạnh`, `Quận 1`, `Tân Bình`, `Hoàn Kiếm`
- Loại hình: `nhà phố`, `đất nền`, `chung cư`
- Giá: câu hỏi về giá, khoảng giá chứa `triệu` hoặc `tỷ`
- Diện tích: `m2`, `m²`

Response mock trả về:
- `response`: text tiếng Việt
- `action`: có thể là `moveMap` hoặc `filterType`

---

## API tham khảo

### Lands

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/lands?bbox=lng1,lat1,lng2,lat2` | Lấy marker land trong bounding box |
| `GET` | `/lands/:id` | Chi tiết land |
| `GET` | `/lands/:id/price-history` | Lịch sử giá 6 tháng |
| `GET` | `/lands/:id/bank-valuations` | Giá ngân hàng |
| `GET` | `/lands/district/:district` | Overview quận/huyện |

### Listings

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/listings?landId=&page=&limit=` | Danh sách listing theo land |
| `GET` | `/listings/:id` | Chi tiết listing |
| `POST` | `/listings` | Tạo listing (auth) |
| `PUT` | `/listings/:id` | Cập nhật listing (auth owner) |
| `DELETE` | `/listings/:id` | Xóa listing (auth owner) |
| `POST` | `/listings/presigned-url` | Lấy S3 presigned URL |

### Search

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/search?q=&type=&minPrice=&maxPrice=&minArea=&maxArea=&listingType=&sortBy=&page=` | Search full-text và filter |

### Chat

| Method | Endpoint | Mô tả |
|---|---|
| `POST` | `/chat` | Gửi message đến AI assistant |
| `POST` | `/chat/search` | Parse message thành filter |

---

## Running locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Web

```bash
cd web
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## Ghi chú

- Chatbot hoạt động ngay cả khi không có OpenAI key nhờ mock mode.
- Khi muốn sử dụng AI thật, thêm `OPENAI_API_KEY` vào `backend/.env`.
- Search filter hiện hỗ trợ `dat_nen`, `nha_pho`, `chung_cu`, `biet_thu`, `van_phong`.

---

## Tài liệu đã gộp

Tất cả nội dung quan trọng đã được tổng hợp vào `README.md`. Các file tài liệu thừa đã xóa để giữ một điểm review duy nhất.
