#!/usr/bin/env node
'use strict';

/**
 * Seed sample real estate data for Đà Nẵng.
 * Run: node backend/scripts/seed-da-nang.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME     || 'realprice',
  user:     process.env.DB_USER     || 'realprice_user',
  password: process.env.DB_PASSWORD || 'realprice_local',
});

// ── Sample data: Đà Nẵng streets & prices ─────────────────────────────────

const LANDS = [
  // Hải Châu
  { address: 'Đường Hùng Vương', ward: 'Phước Ninh', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0672, lng: 108.2127 },
  { address: 'Đường Lê Lợi', ward: 'Thạch Thang', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0662, lng: 108.2210 },
  { address: 'Đường Trần Phú', ward: 'Hải Châu I', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0651, lng: 108.2189 },
  { address: 'Đường Nguyễn Văn Linh', ward: 'Nam Dương', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0579, lng: 108.2168 },
  { address: 'Đường Bạch Đằng', ward: 'Thạch Thang', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0685, lng: 108.2234 },

  // Sơn Trà
  { address: 'Đường Phạm Văn Đồng', ward: 'Mân Thái', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0819, lng: 108.2452 },
  { address: 'Đường Hoàng Sa', ward: 'Thọ Quang', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0938, lng: 108.2374 },
  { address: 'Đường Trần Hưng Đạo', ward: 'An Hải Bắc', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0692, lng: 108.2312 },

  // Ngũ Hành Sơn
  { address: 'Đường Trường Sa', ward: 'Mỹ An', district: 'Ngũ Hành Sơn', province: 'Đà Nẵng', lat: 16.0371, lng: 108.2423 },
  { address: 'Đường Võ Nguyên Giáp', ward: 'Khuê Mỹ', district: 'Ngũ Hành Sơn', province: 'Đà Nẵng', lat: 16.0289, lng: 108.2512 },
  { address: 'Đường Lê Văn Hiến', ward: 'Hòa Hải', district: 'Ngũ Hành Sơn', province: 'Đà Nẵng', lat: 16.0198, lng: 108.2445 },

  // Liên Chiểu
  { address: 'Đường Nguyễn Lương Bằng', ward: 'Hòa Khánh Nam', district: 'Liên Chiểu', province: 'Đà Nẵng', lat: 16.0918, lng: 108.1552 },
  { address: 'Đường Tôn Đức Thắng', ward: 'Hòa Minh', district: 'Liên Chiểu', province: 'Đà Nẵng', lat: 16.0843, lng: 108.1634 },

  // Thanh Khê
  { address: 'Đường Ông Ích Khiêm', ward: 'Thạc Gián', district: 'Thanh Khê', province: 'Đà Nẵng', lat: 16.0731, lng: 108.1982 },
  { address: 'Đường Hoàng Diệu', ward: 'Thanh Khê Tây', district: 'Thanh Khê', province: 'Đà Nẵng', lat: 16.0678, lng: 108.1912 },
];

const LISTING_TEMPLATES = [
  { type: 'nha_pho',  priceBase: 3_500_000_000, area: 72,  desc: 'Nhà phố mặt tiền đường lớn, tiện kinh doanh' },
  { type: 'dat_nen',  priceBase: 1_800_000_000, area: 100, desc: 'Đất nền quy hoạch rõ ràng, sổ đỏ chính chủ' },
  { type: 'chung_cu', priceBase:   950_000_000, area: 65,  desc: 'Căn hộ chung cư hiện đại, view biển' },
  { type: 'biet_thu', priceBase: 8_500_000_000, area: 250, desc: 'Biệt thự khu an ninh, đầy đủ tiện nghi' },
  { type: 'nha_pho',  priceBase: 2_200_000_000, area: 55,  desc: 'Nhà phố 3 tầng, gần trung tâm' },
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding Đà Nẵng sample data...\n');

    let totalLands = 0;
    let totalListings = 0;

    for (const land of LANDS) {
      const slug = slugify(`${land.address}-${land.district}`);
      const lat  = land.lat + randomBetween(-0.002, 0.002);
      const lng  = land.lng + randomBetween(-0.002, 0.002);

      // Upsert land
      const landResult = await client.query(`
        INSERT INTO lands (lat, lng, location, address, ward, district, province, slug, area_m2, land_type, legal_status)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slug) DO UPDATE SET
          lat = EXCLUDED.lat, lng = EXCLUDED.lng,
          location = EXCLUDED.location
        RETURNING id
      `, [
        lat, lng,
        land.address, land.ward, land.district, land.province,
        slug,
        randomBetween(50, 300),
        'residential',
        'so_do',
      ]);

      const landId = landResult.rows[0].id;
      totalLands++;

      // Add 2–4 listings per land
      const numListings = Math.floor(randomBetween(2, 5));
      for (let i = 0; i < numListings; i++) {
        const template = LISTING_TEMPLATES[i % LISTING_TEMPLATES.length];
        const priceMult = randomBetween(0.85, 1.25);
        const price = Math.round(template.priceBase * priceMult / 1_000_000) * 1_000_000;
        const area  = Math.round(template.area * randomBetween(0.8, 1.4));
        const pricePerM2 = area > 0 ? Math.round(price / area) : null;

        await client.query(`
          INSERT INTO listings
            (land_id, title, description, price, area, price_per_m2,
             listing_type, status, address, location, contact_name, contact_phone, images)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
                  ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography,
                  $12, $13, $14)
          ON CONFLICT DO NOTHING
        `, [
          landId,
          `${template.type === 'nha_pho' ? 'Nhà phố' : template.type === 'dat_nen' ? 'Đất nền' : template.type === 'chung_cu' ? 'Chung cư' : template.type === 'biet_thu' ? 'Biệt thự' : 'BĐS'} ${land.address}, ${land.district}`,
          template.desc,
          price,
          area,
          pricePerM2,
          template.type,
          'active',
          `${land.address}, ${land.ward}, ${land.district}, Đà Nẵng`,
          lng + randomBetween(-0.0005, 0.0005),
          lat + randomBetween(-0.0005, 0.0005),
          'Chủ nhà',
          `09${Math.floor(10000000 + Math.random() * 90000000)}`,
          JSON.stringify([]),
        ]);
        totalListings++;
      }

      console.log(`  ✅ ${land.address}, ${land.district} → ${numListings} listings`);
    }

    // Upsert heatmap areas for each district
    const districts = [...new Set(LANDS.map(l => l.district))];
    for (const district of districts) {
      const districtListings = await client.query(`
        SELECT AVG(li.price_per_m2) AS avg_pm2
        FROM listings li
        JOIN lands la ON la.id = li.land_id
        WHERE la.district = $1 AND li.status = 'active'
      `, [district]);

      const avgPm2 = districtListings.rows[0]?.avg_pm2 ?? 30_000_000;
      const heatLevel = avgPm2 > 70_000_000 ? 5 : avgPm2 > 50_000_000 ? 4 : avgPm2 > 30_000_000 ? 3 : avgPm2 > 20_000_000 ? 2 : 1;

      await client.query(`
        INSERT INTO area_price_index
          (district, ward, avg_price, min_price, max_price, avg_price_per_m2,
           median_price, heat_level, total_listings, updated_at)
        VALUES ($1, NULL, $2, $3, $4, $5, $2, $6, $7, NOW())
        ON CONFLICT (district, ward) DO UPDATE SET
          avg_price = EXCLUDED.avg_price,
          avg_price_per_m2 = EXCLUDED.avg_price_per_m2,
          heat_level = EXCLUDED.heat_level,
          total_listings = EXCLUDED.total_listings,
          updated_at = NOW()
      `, [
        district,
        Math.round(avgPm2 * 80),
        Math.round(avgPm2 * 50),
        Math.round(avgPm2 * 150),
        Math.round(avgPm2),
        Math.round(avgPm2 * 75),
        heatLevel,
        LANDS.filter(l => l.district === district).length * 3,
      ]).catch(() => {}); // area_price_index may have different schema
    }

    console.log(`\n✅ Done! Seeded ${totalLands} lands, ${totalListings} listings`);
    console.log('📍 Districts:', districts.join(', '));
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
