'use strict';

const axios  = require('axios');
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

async function crawlNhatot({ district, province }) {
  const src = config.sources.nhatot;
  if (!src.enabled) return [];

  const results = [];
  let page = 1;

  while (page <= config.maxPagesPerRun) {
    try {
      const params = {
        ...src.params,
        page,
        area:   encodeURIComponent(district),
        region: encodeURIComponent(province),
      };

      const resp = await axios.get(src.baseUrl, {
        params,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'application/json', 'Accept-Language': 'vi-VN,vi;q=0.9', 'Origin': 'https://www.chotot.com', 'Referer': 'https://www.chotot.com/' },
        timeout: 15_000,
      });

      const ads = resp.data?.ads ?? [];
      if (ads.length === 0) break;

      for (const ad of ads) {
        const price = parseVNDPrice(ad.price);
        const area  = parseArea(ad.size);
        if (!price || !area) continue;

        results.push({
          source:      'nhatot',
          sourceId:    String(ad.list_id ?? ad.ad_id ?? ''),
          sourceUrl:   ad.list_id
            ? `https://nha.chotot.com/${ad.list_id}`
            : null,
          title:       ad.subject ?? '',
          price,
          area,
          pricePerM2:  area > 0 ? Math.round(price / area) : null,
          address:     ad.address ?? ad.region_name ?? '',
          district:    ad.area_name ?? district,
          province:    ad.region_name ?? province,
          lat:         ad.latitude  ?? null,
          lng:         ad.longitude ?? null,
          images:      Array.isArray(ad.images) ? ad.images : [],
          contactName: ad.account_name ?? null,
          listingType: 'nha_pho', // default; nhatot doesn't always return type
          rawData:     ad,
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
          const $el     = $(el);
          const title   = $el.find(src.selectors.title).text().trim();
          const priceRaw = $el.find(src.selectors.price).text().trim();
          const areaRaw  = $el.find(src.selectors.area).text().trim();
          const address  = $el.find(src.selectors.address).text().trim();
          const imgSrc   = $el.find(src.selectors.image).attr('src') ?? '';
          const link     = $el.find(src.selectors.link).attr('href') ?? '';

          const price = parseVNDPrice(priceRaw);
          const area  = parseArea(areaRaw);
          if (!price && !area) return; // skip if no price or area

          results.push({
            source:    'batdongsan',
            sourceId:  link,
            sourceUrl: link ? `${src.baseUrl}${link}` : null,
            title,
            price:     price ?? 0,
            area:      area  ?? 0,
            pricePerM2: (price && area && area > 0) ? Math.round(price / area) : null,
            address,
            district,
            province:  'Đà Nẵng',
            lat:       null,
            lng:       null,
            images:    imgSrc ? [imgSrc] : [],
            listingType: 'nha_pho',
            rawData:   {},
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

// ── De-duplicate & upsert into DB ────────────────────────────────────────

async function upsertCrawledListings(db, listings) {
  let inserted = 0;
  let skipped  = 0;

  for (const item of listings) {
    try {
      // Check if we already have this source listing
      const existing = await db.query(
        `SELECT id FROM crawled_listings WHERE source = $1 AND source_id = $2`,
        [item.source, item.sourceId]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      // Find or create a land record
      let landId = null;
      if (item.lat && item.lng) {
        // Try to match by GPS proximity (within 30m)
        const nearbyLand = await db.query(
          `SELECT id FROM lands
           WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, 30)
           ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)
           LIMIT 1`,
          [item.lng, item.lat]
        );
        if (nearbyLand.rows.length > 0) {
          landId = nearbyLand.rows[0].id;
        } else {
          // Create new land
          const newLand = await db.query(
            `INSERT INTO lands (lat, lng, location, address, district, province, ward, slug)
             VALUES ($1, $2, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography, $3, $4, $5, '', slugify($3))
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [item.lat, item.lng, item.address, item.district, item.province]
          );
          landId = newLand.rows[0]?.id ?? null;
        }
      }

      // Insert into crawled_listings table
      await db.query(
        `INSERT INTO crawled_listings
          (source, source_id, source_url, title, price, area, price_per_m2,
           address, district, province, lat, lng, images, listing_type,
           land_id, raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          item.source,
          item.sourceId  || '',
          item.sourceUrl || null,
          item.title,
          item.price     || 0,
          item.area      || 0,
          item.pricePerM2 || null,
          item.address,
          item.district,
          item.province,
          item.lat       || null,
          item.lng       || null,
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

// ── Ensure crawled_listings table exists ─────────────────────────────────

async function ensureCrawledTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS crawled_listings (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source        VARCHAR(50)  NOT NULL,
      source_id     VARCHAR(255) NOT NULL,
      source_url    TEXT,
      title         TEXT,
      price         BIGINT,
      area          NUMERIC(10,2),
      price_per_m2  BIGINT,
      address       TEXT,
      district      VARCHAR(100),
      province      VARCHAR(100),
      lat           DOUBLE PRECISION,
      lng           DOUBLE PRECISION,
      images        JSONB DEFAULT '[]',
      listing_type  VARCHAR(50) DEFAULT 'nha_pho',
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
  const summary   = { nhatot: 0, batdongsan: 0, total: 0, inserted: 0, skipped: 0 };

  for (const location of locations) {
    console.info(`[Crawler] Crawling ${location.district}, ${location.province}`);

    // Crawl both sources in parallel per location
    const [nhatotItems, bdsItems] = await Promise.all([
      crawlNhatot(location),
      crawlBatDongSan(location),
    ]);

    summary.nhatot      += nhatotItems.length;
    summary.batdongsan  += bdsItems.length;
    const allItems       = [...nhatotItems, ...bdsItems];
    summary.total       += allItems.length;

    const { inserted, skipped } = await upsertCrawledListings(db, allItems);
    summary.inserted += inserted;
    summary.skipped  += skipped;

    console.info(
      `[Crawler] ${location.district}: nhatot=${nhatotItems.length}, ` +
      `bds=${bdsItems.length}, inserted=${inserted}, skipped=${skipped}`
    );

    await delay(config.requestDelayMs);
  }

  return summary;
}

module.exports = { runCrawl, crawlNhatot, crawlBatDongSan, ensureCrawledTable };
