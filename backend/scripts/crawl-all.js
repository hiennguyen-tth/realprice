'use strict';

const axios = require('axios');
const { Pool } = require('pg');

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

async function fetchPage(page) {
  const resp = await axios.get('https://gateway.chotot.com/v1/public/ad-listing', {
    params: { cg: 1000, limit: 20, page, st: 's,k' },
    headers: HEADERS,
    timeout: 15000,
  });
  return resp.data?.ads ?? [];
}

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
  // area_name thường là "Quận Tân Bình", "Huyện Củ Chi"...
  const areaName = ad.area_name || '';
  return areaName
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
    ad.region_name
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : (ad.region_name || '');
}

function getListingType(ad) {
  const cat = ad.category || 0;
  if (cat === 1010) return 'chung_cu';
  if (cat === 1020) return 'nha_pho';
  if (cat === 1030) return 'dat_nen';
  if (cat === 1040) return 'biet_thu';
  return 'nha_pho';
}

async function insertListing(client, ad) {
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

  try {
    if (lat && lng) {
      await client.query(`
        INSERT INTO listings (title, price, area, price_per_m2, listing_type, status, address, contact_name, contact_phone, location, score, district, province)
        VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,ST_SetSRID(ST_MakePoint($9,$10),4326),50,$11,$12)
        ON CONFLICT DO NOTHING
      `, [ad.subject, price, area, pricePerM2, listingType, address, ad.account_name || '', ad.phone || '', lng, lat, district, province]);
    } else {
      await client.query(`
        INSERT INTO listings (title, price, area, price_per_m2, listing_type, status, address, contact_name, contact_phone, score, district, province)
        VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,50,$9,$10)
        ON CONFLICT DO NOTHING
      `, [ad.subject, price, area, pricePerM2, listingType, address, ad.account_name || '', ad.phone || '', district, province]);
    }
    return true;
  } catch (e) {
    console.error('Insert error:', e.message);
    return false;
  }
}

async function main() {
  const client = await pool.connect();
  let totalInserted = 0;
  let totalFailed = 0;
  let page = 1;
  const MAX_PAGES = 500;

  console.log('🚀 Bắt đầu crawl toàn quốc từ Chotot...');

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
          const ok = await insertListing(client, ad);
          if (ok) totalInserted++;
          else totalFailed++;
        }

        // Sample log để verify district
        if (page === 1 && ads[0]) {
          console.log('Sample:', {
            district: extractDistrict(ads[0]),
            province: extractProvince(ads[0]),
            address: extractAddress(ads[0]),
          });
        }

        console.log(`✅ Page ${page}: inserted: ${totalInserted}`);
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

  console.log(`\n🎉 Done! Inserted: ${totalInserted}, Failed/Skipped: ${totalFailed}`);

  // Rebuild lands and heatmap sau khi crawl
  const rebuildClient = await pool.connect();
  try {
    await rebuildLandsAndHeatmap(rebuildClient);
  } finally {
    rebuildClient.release();
    await pool.end();
  }
}

main().catch(console.error);

async function rebuildLandsAndHeatmap(client) {
  console.log('🔄 Rebuilding lands and heatmap...');

  // Tạo/update lands
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

  // Link listings → lands
  await client.query(`
    UPDATE listings li
    SET land_id = l.id
    FROM lands l
    WHERE li.address = l.address AND li.location = l.location AND li.land_id IS NULL
  `);

  // Rebuild heatmap
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
