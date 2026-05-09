'use strict';

const axios = require('axios');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.PGHOST || 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres.cfijbqebatmahuhpdrqp',
  password: process.env.PGPASSWORD || 'Aa25485998@',
  ssl: { rejectUnauthorized: false }
});

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Origin': 'https://www.chotot.com',
  'Referer': 'https://www.chotot.com/',
};

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Fetch listing list page ───────────────────────────────────────────────

async function fetchPage(page) {
  const resp = await axios.get('https://gateway.chotot.com/v1/public/ad-listing', {
    params: { cg: 1000, limit: 20, page, st: 's,k' },
    headers: HEADERS,
    timeout: 15000,
  });
  return resp.data?.ads ?? [];
}

// ── Fetch detail of a single ad (has images + description) ───────────────

async function fetchAdDetail(listId) {
  try {
    const resp = await axios.get(`https://gateway.chotot.com/v1/public/ad-listing/${listId}`, {
      headers: HEADERS,
      timeout: 10000,
    });
    return resp.data?.ad ?? null;
  } catch {
    return null;
  }
}

// ── Parsers ───────────────────────────────────────────────────────────────

function parsePrice(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const str = String(raw).toLowerCase().replace(/\s/g, '');
  if (str.includes('tỷ') || str.includes('ty')) return Math.round(parseFloat(str) * 1e9);
  if (str.includes('triệu') || str.includes('tr')) return Math.round(parseFloat(str) * 1e6);
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

function extractDistrict(ad) {
  return (ad.area_name || '')
    .replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '')
    .trim();
}

function extractProvince(ad) {
  return ad.region_name || '';
}

function extractAddress(ad) {
  const parts = [
    ad.subject_params?.address,
    ad.area_name,
    ad.region_name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : (ad.region_name || '');
}

function getListingType(ad) {
  const cat = ad.category || ad.category_id || 0;
  if (cat === 1010) return 'chung_cu';
  if (cat === 1020) return 'nha_pho';
  if (cat === 1030) return 'dat_nen';
  if (cat === 1040) return 'biet_thu';
  return 'nha_pho';
}

// ── Extract images từ ad (list hoặc detail) ──────────────────────────────

function extractImages(ad) {
  // Từ detail API: ad.images là array of { name, ... }
  if (Array.isArray(ad.images) && ad.images.length > 0) {
    return ad.images.map(img => {
      if (typeof img === 'string') return img;
      // Chotot image URL pattern
      const name = img.name || img.url || img.src || '';
      return name.startsWith('http')
        ? name
        : `https://static.chotot.com/storage/chotot-kinhnghiem/c2c/picture/${name}`;
    }).filter(Boolean);
  }
  // Từ list API: thumbnail
  if (ad.thumbnail) return [ad.thumbnail];
  return [];
}

// ── Insert 1 listing vào DB ───────────────────────────────────────────────

async function insertListing(client, ad, detail) {
  const price = parsePrice(ad.price);
  const area = ad.size || ad.area;
  if (!price || !area) return false;

  const pricePerM2 = Math.round(price / area);
  const lat = ad.latitude;
  const lng = ad.longitude;
  const district = extractDistrict(ad);
  const province = extractProvince(ad);
  const address = extractAddress(ad);
  const listingType = getListingType(ad);

  // Merge list data + detail data
  const merged = { ...ad, ...(detail || {}) };

  // ── FIX: lấy images + description + source_url ──
  const images = extractImages(merged);
  const description = merged.body || merged.content || merged.description || null;
  const sourceId = String(ad.list_id || ad.ad_id || '');
  const sourceUrl = sourceId ? `https://nha.chotot.com/${sourceId}` : null;

  const sourceHash = crypto.createHash('md5')
    .update((ad.subject || '').toLowerCase().trim() + price + (area || '') + address)
    .digest('hex');

  try {
    const existing = await client.query(
      'SELECT id FROM listings WHERE source_hash = $1 LIMIT 1',
      [sourceHash]
    );

    if (existing.rows.length > 0) {
      // ── Update images/description nếu record cũ bị thiếu ──
      await client.query(`
        UPDATE listings
        SET
          images      = CASE WHEN images = '{}' THEN $1 ELSE images END,
          description = CASE WHEN description IS NULL THEN $2 ELSE description END,
          source_url  = CASE WHEN source_url IS NULL THEN $3 ELSE source_url END,
          source      = CASE WHEN source IS NULL THEN 'nhatot' ELSE source END,
          source_id   = CASE WHEN source_id IS NULL THEN $4 ELSE source_id END,
          updated_at  = NOW()
        WHERE source_hash = $5
      `, [images, description, sourceUrl, sourceId, sourceHash]);
      return false; // không tính là inserted mới
    }

    // Insert mới
    const base = [
      ad.subject, description, price, area, pricePerM2, listingType,
      address, ad.account_name || null, ad.phone || null,
      district, province, sourceHash,
      'nhatot', sourceId, sourceUrl,
      images,
    ];

    if (lat && lng) {
      await client.query(`
        INSERT INTO listings (
          title, description, price, area, price_per_m2, listing_type, status,
          address, contact_name, contact_phone,
          district, province, source_hash,
          source, source_id, source_url,
          images, location, score
        ) VALUES (
          $1,$2,$3,$4,$5,$6,'active',
          $7,$8,$9,
          $10,$11,$12,
          $13,$14,$15,
          $16, ST_SetSRID(ST_MakePoint($17,$18),4326), 50
        )
      `, [...base, lng, lat]);
    } else {
      await client.query(`
        INSERT INTO listings (
          title, description, price, area, price_per_m2, listing_type, status,
          address, contact_name, contact_phone,
          district, province, source_hash,
          source, source_id, source_url,
          images, score
        ) VALUES (
          $1,$2,$3,$4,$5,$6,'active',
          $7,$8,$9,
          $10,$11,$12,
          $13,$14,$15,
          $16, 50
        )
      `, base);
    }
    return true;
  } catch (e) {
    console.error('Insert error:', e.message);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let page = 1;
  const MAX_PAGES = 50;

  console.log('🚀 Bắt đầu crawl toàn quốc từ Chotot (có ảnh + mô tả)...');

  try {
    while (page <= MAX_PAGES) {
      try {
        console.log(`📄 Page ${page}/${MAX_PAGES}...`);
        const ads = await fetchPage(page);

        if (ads.length === 0) {
          console.log('Hết data!');
          break;
        }

        for (const ad of ads) {
          // ── Fetch detail để lấy images + description ──
          const listId = ad.list_id || ad.ad_id;
          const detail = listId ? await fetchAdDetail(listId) : null;
          await delay(300); // tránh rate limit

          const ok = await insertListing(client, ad, detail);
          if (ok) totalInserted++;
          else totalUpdated++;
        }

        console.log(`✅ Page ${page}: inserted=${totalInserted}, updated=${totalUpdated}`);
        page++;
        await delay(1500);
      } catch (e) {
        console.error(`❌ Page ${page} failed:`, e.message);
        await delay(3000);
        page++;
      }
    }
  } finally {
    client.release();
  }

  console.log(`\n🎉 Done! Inserted: ${totalInserted}, Updated: ${totalUpdated}, Failed: ${totalFailed}`);

  const rebuildClient = await pool.connect();
  try {
    await cleanDuplicates(rebuildClient);
    await rebuildLandsAndHeatmap(rebuildClient);
  } finally {
    rebuildClient.release();
    await pool.end();
  }
}

main().catch(console.error);

// ── Cleanup & rebuild (giữ nguyên từ bản gốc) ────────────────────────────

async function cleanDuplicates(client) {
  console.log('🧹 Cleaning duplicates...');
  const result = await client.query(`
    DELETE FROM listings
    WHERE id NOT IN (
      SELECT DISTINCT ON (title, price, area, address) id
      FROM listings
      ORDER BY title, price, area, address, created_at ASC
    )
  `);
  console.log(`✅ Removed ${result.rowCount} duplicates`);
}

async function rebuildLandsAndHeatmap(client) {
  console.log('🔄 Rebuilding lands and heatmap...');

  await client.query(`
    INSERT INTO lands (address, district, city, slug_district, slug_street, location, min_price, max_price, avg_price, price_per_m2, total_listings)
    SELECT
      address,
      COALESCE(NULLIF(district, ''), 'Khác') as district,
      COALESCE(NULLIF(province, ''), 'Vietnam') as city,
      LOWER(REGEXP_REPLACE(COALESCE(NULLIF(district, ''), 'khac'), '[^a-z0-9]', '-', 'g')) as slug_district,
      LOWER(REGEXP_REPLACE(address, '[^a-z0-9]', '-', 'g')) || '-' || FLOOR(RANDOM()*9999)::text as slug_street,
      location,
      MIN(price), MAX(price), AVG(price)::BIGINT, AVG(price_per_m2)::BIGINT, COUNT(*)
    FROM listings
    WHERE location IS NOT NULL
    GROUP BY address, district, province, location
    ON CONFLICT (slug_district, slug_street) DO NOTHING
  `);

  await client.query(`
    UPDATE listings li
    SET land_id = l.id
    FROM lands l
    WHERE li.address = l.address AND li.location = l.location AND li.land_id IS NULL
  `);

  await client.query(`DELETE FROM area_price_index`);
  await client.query(`
    INSERT INTO area_price_index (district, city, avg_price, avg_price_per_m2, total_listings, min_price, max_price, price_level, heat_level, color, boundary)
    SELECT
      COALESCE(NULLIF(district, ''), 'Khác'),
      COALESCE(NULLIF(province, ''), 'Vietnam'),
      AVG(price)::BIGINT, AVG(price_per_m2)::BIGINT, COUNT(*),
      MIN(price), MAX(price),
      CASE WHEN AVG(price_per_m2) < 30000000 THEN 1 WHEN AVG(price_per_m2) < 60000000 THEN 2 WHEN AVG(price_per_m2) < 100000000 THEN 3 WHEN AVG(price_per_m2) < 200000000 THEN 4 ELSE 5 END,
      CASE WHEN AVG(price_per_m2) < 30000000 THEN 1 WHEN AVG(price_per_m2) < 60000000 THEN 2 WHEN AVG(price_per_m2) < 100000000 THEN 3 WHEN AVG(price_per_m2) < 200000000 THEN 4 ELSE 5 END,
      CASE WHEN AVG(price_per_m2) < 30000000 THEN '#22c55e' WHEN AVG(price_per_m2) < 60000000 THEN '#84cc16' WHEN AVG(price_per_m2) < 100000000 THEN '#eab308' WHEN AVG(price_per_m2) < 200000000 THEN '#f97316' ELSE '#ef4444' END,
      ST_Buffer(ST_ConvexHull(ST_Collect(location::geometry))::geography, 1500)::geometry
    FROM listings
    WHERE location IS NOT NULL AND price > 0 AND price_per_m2 > 0
      AND district IS NOT NULL AND district != ''
    GROUP BY COALESCE(NULLIF(district, ''), 'Khác'), COALESCE(NULLIF(province, ''), 'Vietnam')
    HAVING COUNT(*) >= 2
  `);

  console.log('✅ Lands and heatmap rebuilt!');
}