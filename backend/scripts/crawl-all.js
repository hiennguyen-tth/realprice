'use strict';

const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.cfijbqebatmahuhpdrqp',
  password: 'Aa25485998@',
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
  return null;
}

async function insertListing(client, ad) {
  const price = parsePrice(ad.price);
  const area = ad.size || ad.area;
  if (!price || !area) return false;

  const pricePerM2 = Math.round(price / area);
  const lat = ad.latitude;
  const lng = ad.longitude;

  const listingType = (() => {
    const cat = ad.category || 0;
    if (cat === 1010) return 'chung_cu';
    if (cat === 1020) return 'nha_pho';
    if (cat === 1030) return 'dat_nen';
    if (cat === 1040) return 'biet_thu';
    return 'nha_pho';
  })();

  // Extract district from area_name (e.g. "Quận Tân Bình" → "Tân Bình")
  const district = (ad.area_name || '').replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '').trim();
  const province = ad.region_name || '';
  const address = [ad.subject_params?.address, ad.area_name, ad.region_name].filter(Boolean).join(', ') || ad.region_name || '';

  try {
    await client.query(`
      INSERT INTO listings (title, price, area, price_per_m2, listing_type, status, address, contact_name, contact_phone, location, score, district, province)
      VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,
        ${lat && lng ? `ST_SetSRID(ST_MakePoint($9,$10),4326)` : 'NULL'},
        50,${lat && lng ? '$11,$12' : '$9,$10'})
      ON CONFLICT DO NOTHING
    `, lat && lng
      ? [ad.subject, price, area, pricePerM2, listingType, address, ad.account_name || '', ad.phone || '', lng, lat, district, province]
      : [ad.subject, price, area, pricePerM2, listingType, address, ad.account_name || '', ad.phone || '', district, province]
    );
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const client = await pool.connect();
  let totalInserted = 0;
  let totalFailed = 0;
  let page = 1;
  const MAX_PAGES = 50; // ~1000 listings

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

        console.log(`✅ Page ${page}: +${ads.length} ads | Total inserted: ${totalInserted}`);
        page++;
        await delay(1500); // tránh bị block
      } catch (e) {
        console.error(`❌ Page ${page} failed:`, e.message);
        await delay(3000);
        page++;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n🎉 Done! Inserted: ${totalInserted}, Failed/Skipped: ${totalFailed}`);
}

main().catch(console.error);
