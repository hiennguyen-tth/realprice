'use strict';
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.cfijbqebatmahuhpdrqp',
  password: 'Aa25485998@',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const geojson = JSON.parse(fs.readFileSync('./scripts/vietnam-districts.json', 'utf8'));
  
  console.log(`Found ${geojson.features.length} districts`);
  let inserted = 0;

  for (const feature of geojson.features) {
    const props = feature.properties;
    const district = props.NAME_2 || props.name || '';
    const province = props.NAME_1 || props.province || '';
    
    if (!district || feature.geometry?.type !== 'Polygon' && feature.geometry?.type !== 'MultiPolygon') continue;

    try {
      await client.query(`
        INSERT INTO area_price_index (district, city, avg_price, avg_price_per_m2, total_listings, heat_level, price_level, color, boundary)
        VALUES ($1, $2, 0, 0, 0, 3, 3, '#eab308', ST_GeomFromGeoJSON($3))
        ON CONFLICT DO NOTHING
      `, [district, province, JSON.stringify(feature.geometry)]);
      inserted++;
    } catch(e) {
      console.error(`Error inserting ${district}:`, e.message);
    }
  }

  console.log(`Inserted ${inserted} districts`);
  client.release();
  await pool.end();
}

main().catch(console.error);
