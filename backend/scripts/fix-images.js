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

function buildImageUrl(name) {
  if (!name) return null;
  if (name.startsWith('http')) return name;
  return `https://static.chotot.com/storage/chotot-realestate/c2c/original/${name}`;
}

async function fetchImages(sourceId) {
  try {
    const resp = await axios.get(
      `https://gateway.chotot.com/v1/public/ad-listing/${sourceId}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const ad = resp.data && resp.data.ad;
    if (!ad) return [];
    if (Array.isArray(ad.images) && ad.images.length > 0) {
      return ad.images.map(img => {
        if (typeof img === 'string') return buildImageUrl(img);
        const name = img.name || img.url || img.src || '';
        return buildImageUrl(name);
      }).filter(Boolean);
    }
    if (ad.thumbnail) return [ad.thumbnail];
    return [];
  } catch (e) {
    return [];
  }
}

async function main() {
  const client = await pool.connect();
  const result = await client.query(`
    SELECT id, source_id
    FROM listings
    WHERE (images IS NULL OR images = '{}' OR array_length(images, 1) IS NULL)
      AND source_id IS NOT NULL AND source_id != ''
    ORDER BY id
  `);
  const rows = result.rows;
  const total = rows.length;
  console.log('Found ' + total + ' records missing images. Starting fix...');

  let fixed = 0;
  let noImages = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const id = rows[i].id;
    const source_id = rows[i].source_id;
    try {
      const images = await fetchImages(source_id);
      if (images.length > 0) {
        await client.query(
          'UPDATE listings SET images = $1, updated_at = NOW() WHERE id = $2',
          [images, id]
        );
        fixed++;
      } else {
        noImages++;
      }
    } catch (e) {
      console.error('Failed id=' + id + ':', e.message);
      failed++;
    }
    if ((i + 1) % 50 === 0 || i + 1 === total) {
      console.log('[' + (i + 1) + '/' + total + '] fixed=' + fixed + ', no_images=' + noImages + ', failed=' + failed);
    }
    await delay(300);
  }

  client.release();
  await pool.end();
  console.log('Done! Fixed=' + fixed + ', NoImages=' + noImages + ', Failed=' + failed);
}

main().catch(console.error);
