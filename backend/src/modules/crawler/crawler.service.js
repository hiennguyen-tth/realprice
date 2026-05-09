'use strict';

const axios = require('axios');
const config = require('./crawler.config');

// Try to load cheerio — optional dep (npm install cheerio)
let cheerio;
try {
  cheerio = require('cheerio');
} catch {
  cheerio = null;
}

// ── Helper: parse price string → number (VND) ────────────────────────────

function parseVNDPrice(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const str = String(raw).replace(/\s/g, '').toLowerCase();
  if (str.includes('tỷ') || str.includes('ty')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return Math.round(num * 1_000_000_000);
  }
  if (str.includes('triệu') || str.includes('trieu') || str.includes('tr')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return Math.round(num * 1_000_000);
  }
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : Math.round(num);
}

// ── Helper: parse area string → m² ──────────────────────────────────────

function parseArea(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const num = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

// ── Delay helper ─────────────────────────────────────────────────────────

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ── Nhatot (Chợ Tốt) — uses JSON API ────────────────────────────────────

async function crawlNhatot({ district, province, areaV2, regionV2 }) {
  const src = config.sources.nhatot;
  if (!src.enabled) return [];

  const results = [];
  let page = 1;

  while (page <= config.maxPagesPerRun) {
    try {
      const params = {
        ...src.params,
        page,
        ...(areaV2 ? { area_v2: areaV2 } : {}),
        ...(regionV2 ? { region_v2: regionV2 } : {}),
      };

      const resp = await axios.get(src.baseUrl, {
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'vi-VN,vi;q=0.9',
          'Origin': 'https://www.chotot.com',
          'Referer': 'https://www.chotot.com/',
        },
        timeout: 15_000,
      });

      const ads = resp.data?.ads ?? [];
      if (ads.length === 0) break;

      for (const ad of ads) {
        const price = parseVNDPrice(ad.price);
        const area = parseArea(ad.size);
        if (!price || !area) continue;

        // ── FIX: extract images properly from nhatot ──
        let images = [];
        if (Array.isArray(ad.images)) {
          images = ad.images
            .map(img => typeof img === 'string' ? img : (img.url || img.src || img.name || ''))
            .filter(Boolean)
            .map(url => url.startsWith('http') ? url : `https://static.chotot.com/storage/chotot-kinhnghiem/c2c/2019/06/${url}`);
        }
        // Some nhatot ads put images under thumbnail
        if (images.length === 0 && ad.thumbnail) {
          images = [ad.thumbnail];
        }

        results.push({
          source: 'nhatot',
          sourceId: String(ad.list_id ?? ad.ad_id ?? ''),
          sourceUrl: ad.list_id ? `https://nha.chotot.com/${ad.list_id}` : null,
          title: ad.subject ?? '',
          // ── FIX: use body as description ──
          description: ad.body ?? ad.content ?? null,
          price,
          area,
          pricePerM2: area > 0 ? Math.round(price / area) : null,
          address: ad.address ?? ad.region_name ?? '',
          district: ad.area_name ?? district,
          ward: ad.ward_name ?? null,
          province: ad.region_name ?? province,
          // ── FIX: lat/lng from correct fields ──
          lat: ad.latitude ?? ad.lat ?? null,
          lng: ad.longitude ?? ad.long ?? ad.lng ?? null,
          images,
          contactName: ad.account_name ?? null,
          contactPhone: ad.contact_info?.phone ?? ad.phone ?? null,
          listingType: mapNhatotCategory(ad.category_id),
          rawData: ad,
        });
      }

      if (ads.length < src.params.limit) break;
      page++;
      await delay(config.requestDelayMs);
    } catch (err) {
      console.warn(`[Crawler][Nhatot] Page ${page} failed: ${err.message}`);
      break;
    }
  }

  return results;
}

// ── Map nhatot category_id to listing_type ───────────────────────────────

function mapNhatotCategory(categoryId) {
  const map = {
    1000: 'nha_pho',
    1010: 'can_ho',
    1020: 'dat',
    1030: 'biet_thu',
    1040: 'nha_tro',
  };
  return map[categoryId] ?? 'nha_pho';
}

// ── BatDongSan — HTML scraping ───────────────────────────────────────────

async function crawlBatDongSan({ district }) {
  const src = config.sources.batdongsan;
  if (!src.enabled) return [];
  if (!cheerio) {
    console.warn('[Crawler][BDS] cheerio not installed — skipping HTML scraping. Run: npm install cheerio');
    return [];
  }

  const results = [];
  let page = 1;

  while (page <= config.maxPagesPerRun) {
    try {
      const url = `${src.baseUrl}${src.searchPath}/${encodeURIComponent(district.toLowerCase().replace(/\s+/g, '-'))}`;
      const params = page > 1 ? { p: page } : {};

      const resp = await axios.get(url, {
        params,
        headers: {
          'User-Agent': config.userAgent,
          'Accept-Language': 'vi-VN,vi;q=0.9',
        },
        timeout: 20_000,
      });

      const $ = cheerio.load(resp.data);
      const items = $(src.selectors.item);
      if (items.length === 0) break;

      items.each((_, el) => {
        try {
          const $el = $(el);
          const title = $el.find(src.selectors.title).text().trim();
          const priceRaw = $el.find(src.selectors.price).text().trim();
          const areaRaw = $el.find(src.selectors.area).text().trim();
          const address = $el.find(src.selectors.address).text().trim();
          const description = $el.find(src.selectors.description ?? '.re__card-description').text().trim() || null;

          // ── FIX: collect ALL images, not just first ──
          const images = [];
          $el.find('img').each((_, imgEl) => {
            const src2 = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-original') || '';
            if (src2 && src2.startsWith('http') && !src2.includes('placeholder')) {
              images.push(src2);
            }
          });

          const link = $el.find(src.selectors.link).attr('href') ?? '';
          const price = parseVNDPrice(priceRaw);
          const area = parseArea(areaRaw);
          if (!price && !area) return;

          results.push({
            source: 'batdongsan',
            sourceId: link,
            sourceUrl: link ? `${src.baseUrl}${link}` : null,
            title,
            description,
            price: price ?? 0,
            area: area ?? 0,
            pricePerM2: (price && area && area > 0) ? Math.round(price / area) : null,
            address,
            district,
            ward: null,
            province: 'Đà Nẵng',
            lat: null,
            lng: null,
            images,
            listingType: 'nha_pho',
            rawData: {},
          });
        } catch {
          // skip malformed item
        }
      });

      const hasNext = $('a.re__pagination-next').length > 0;
      if (!hasNext) break;
      page++;
      await delay(config.requestDelayMs);
    } catch (err) {
      console.warn(`[Crawler][BDS] Page ${page} failed: ${err.message}`);
      break;
    }
  }

  return results;
}

// ── De-duplicate & upsert into crawled_listings ──────────────────────────

async function upsertCrawledListings(db, listings) {
  let inserted = 0;
  let skipped = 0;

  for (const item of listings) {
    try {
      const existing = await db.query(
        `SELECT id FROM crawled_listings WHERE source = $1 AND source_id = $2`,
        [item.source, item.sourceId]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      // Find or create a land record
      let landId = null;
      if (item.lat && item.lng) {
        const nearbyLand = await db.query(
          `SELECT id FROM lands
           WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geometry, 30)
           ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geometry)
           LIMIT 1`,
          [item.lng, item.lat]
        );
        if (nearbyLand.rows.length > 0) {
          landId = nearbyLand.rows[0].id;
        } else {
          const newLand = await db.query(
            `INSERT INTO lands (location, address, district, province, ward, slug)
             VALUES (ST_SetSRID(ST_MakePoint($1,$2),4326)::geometry, $3, $4, $5, $6, slugify($3))
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [item.lng, item.lat, item.address, item.district, item.province, item.ward ?? '']
          );
          landId = newLand.rows[0]?.id ?? null;
        }
      }

      await db.query(
        `INSERT INTO crawled_listings
          (source, source_id, source_url, title, description, price, area, price_per_m2,
           address, district, ward, province, lat, lng, images, listing_type,
           land_id, raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          item.source,
          item.sourceId || '',
          item.sourceUrl || null,
          item.title,
          item.description || null,
          item.price || 0,
          item.area || 0,
          item.pricePerM2 || null,
          item.address,
          item.district,
          item.ward || null,
          item.province,
          item.lat || null,
          item.lng || null,
          JSON.stringify(item.images || []),
          item.listingType || 'nha_pho',
          landId,
          JSON.stringify(item.rawData || {}),
        ]
      );
      inserted++;
    } catch (err) {
      console.warn(`[Crawler] Upsert failed for ${item.sourceId}: ${err.message}`);
    }
  }

  return { inserted, skipped };
}

// ── Sync crawled_listings → listings (production table) ──────────────────
//
// Đây là bước bị thiếu — crawler lưu vào crawled_listings nhưng
// listings (bảng production) không được cập nhật.

async function syncToListings(db) {
  // Lấy tất cả crawled_listings chưa có trong listings (theo source + source_id)
  const { rows: pending } = await db.query(`
    SELECT cl.*
    FROM crawled_listings cl
    LEFT JOIN listings l ON l.source = cl.source AND l.source_id = cl.source_id
    WHERE l.id IS NULL
    ORDER BY cl.crawled_at DESC
  `);

  console.info(`[Sync] Found ${pending.length} new crawled listings to sync`);

  let synced = 0;
  let failed = 0;

  for (const cl of pending) {
    try {
      // Parse images từ JSONB → text[] cho bảng listings
      let imagesArray = [];
      if (cl.images) {
        const parsed = typeof cl.images === 'string' ? JSON.parse(cl.images) : cl.images;
        imagesArray = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      }

      // Build location geometry nếu có lat/lng
      const hasLocation = cl.lat && cl.lng;

      await db.query(
        `INSERT INTO listings (
          land_id, title, description, price, area, price_per_m2,
          listing_type, status, images, address, district, ward, province,
          contact_name, contact_phone,
          source, source_id, source_url,
          ${hasLocation ? 'location,' : ''}
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, 'active', $8::text[], $9, $10, $11, $12,
          $13, $14,
          $15, $16, $17,
          ${hasLocation ? 'ST_SetSRID(ST_MakePoint($18,$19),4326)::geometry,' : ''}
          NOW(), NOW()
        )
        ON CONFLICT (source, source_id) DO UPDATE SET
          images      = EXCLUDED.images,
          description = EXCLUDED.description,
          source_url  = EXCLUDED.source_url,
          updated_at  = NOW()`,
        hasLocation
          ? [
            cl.land_id, cl.title, cl.description, cl.price, cl.area, cl.price_per_m2,
            cl.listing_type, imagesArray, cl.address, cl.district, cl.ward, cl.province,
            cl.contact_name, cl.contact_phone,
            cl.source, cl.source_id, cl.source_url,
            cl.lng, cl.lat,
          ]
          : [
            cl.land_id, cl.title, cl.description, cl.price, cl.area, cl.price_per_m2,
            cl.listing_type, imagesArray, cl.address, cl.district, cl.ward, cl.province,
            cl.contact_name, cl.contact_phone,
            cl.source, cl.source_id, cl.source_url,
          ]
      );
      synced++;
    } catch (err) {
      console.warn(`[Sync] Failed for crawled_listing ${cl.id}: ${err.message}`);
      failed++;
    }
  }

  console.info(`[Sync] Done: synced=${synced}, failed=${failed}`);
  return { synced, failed };
}

// ── Ensure crawled_listings table exists ─────────────────────────────────

async function ensureCrawledTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS crawled_listings (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source        VARCHAR(50)  NOT NULL,
      source_id     VARCHAR(255) NOT NULL,
      source_url    TEXT,
      title         TEXT,
      description   TEXT,
      price         BIGINT,
      area          NUMERIC(10,2),
      price_per_m2  BIGINT,
      address       TEXT,
      district      VARCHAR(100),
      ward          VARCHAR(100),
      province      VARCHAR(100),
      lat           DOUBLE PRECISION,
      lng           DOUBLE PRECISION,
      images        JSONB DEFAULT '[]',
      listing_type  VARCHAR(50) DEFAULT 'nha_pho',
      contact_name  TEXT,
      contact_phone TEXT,
      land_id       UUID REFERENCES lands(id) ON DELETE SET NULL,
      raw_data      JSONB DEFAULT '{}',
      crawled_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source, source_id)
    )
  `);
}

// ── Main crawl function ──────────────────────────────────────────────────

async function runCrawl(db) {
  await ensureCrawledTable(db);

  const locations = config.locations;
  const summary = { nhatot: 0, batdongsan: 0, total: 0, inserted: 0, skipped: 0, synced: 0 };

  for (const location of locations) {
    console.info(`[Crawler] Crawling ${location.district}, ${location.province}`);

    const [nhatotItems, bdsItems] = await Promise.all([
      crawlNhatot(location),
      crawlBatDongSan(location),
    ]);

    summary.nhatot += nhatotItems.length;
    summary.batdongsan += bdsItems.length;
    const allItems = [...nhatotItems, ...bdsItems];
    summary.total += allItems.length;

    const { inserted, skipped } = await upsertCrawledListings(db, allItems);
    summary.inserted += inserted;
    summary.skipped += skipped;

    console.info(
      `[Crawler] ${location.district}: nhatot=${nhatotItems.length}, ` +
      `bds=${bdsItems.length}, inserted=${inserted}, skipped=${skipped}`
    );

    await delay(config.requestDelayMs);
  }

  // ── Sau khi crawl xong, sync vào bảng listings ──
  const { synced, failed } = await syncToListings(db);
  summary.synced = synced;

  console.info(`[Crawler] Summary:`, summary);
  return summary;
}

module.exports = { runCrawl, crawlNhatot, crawlBatDongSan, ensureCrawledTable, syncToListings };