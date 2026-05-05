#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'realprice',
    user: process.env.DB_USER || 'realprice_user',
    password: process.env.DB_PASSWORD || 'realprice_local',
});

const LANDS = [
    { address: 'Đường Hùng Vương', ward: 'Phước Ninh', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0672, lng: 108.2127 },
    { address: 'Đường Lê Lợi', ward: 'Thạch Thang', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0662, lng: 108.2210 },
    { address: 'Đường Trần Phú', ward: 'Hải Châu I', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0651, lng: 108.2189 },
    { address: 'Đường Nguyễn Văn Linh', ward: 'Nam Dương', district: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0579, lng: 108.2168 },
    { address: 'Đường Phạm Văn Đồng', ward: 'Mân Thái', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0819, lng: 108.2452 },
    { address: 'Đường Hoàng Sa', ward: 'Thọ Quang', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0938, lng: 108.2374 },
    { address: 'Đường Trần Hưng Đạo', ward: 'An Hải Bắc', district: 'Sơn Trà', province: 'Đà Nẵng', lat: 16.0692, lng: 108.2312 },
    { address: 'Đường Võ Nguyên Giáp', ward: 'Khuê Mỹ', district: 'Ngũ Hành Sơn', province: 'Đà Nẵng', lat: 16.0289, lng: 108.2512 },
    { address: 'Đường Tôn Đức Thắng', ward: 'Hòa Minh', district: 'Liên Chiểu', province: 'Đà Nẵng', lat: 16.0843, lng: 108.1634 },
    { address: 'Đường Hoàng Diệu', ward: 'Thanh Khê Tây', district: 'Thanh Khê', province: 'Đà Nẵng', lat: 16.0678, lng: 108.1912 },
    // Hồ Chí Minh sample data for default map viewport
    { address: 'Đường Cách Mạng Tháng 8', ward: '15', district: 'Quận 10', province: 'TP.HCM', lat: 10.7952, lng: 106.6661 },
    { address: 'Đường Sư Vạn Hạnh', ward: '12', district: 'Quận 10', province: 'TP.HCM', lat: 10.7851, lng: 106.6642 },
    { address: 'Đường Lý Thường Kiệt', ward: '14', district: 'Quận 10', province: 'TP.HCM', lat: 10.7864, lng: 106.6509 },
    { address: 'Đường Tô Hiến Thành', ward: '14', district: 'Quận 10', province: 'TP.HCM', lat: 10.7903, lng: 106.6754 },
    { address: 'Đường 3 Tháng 2', ward: '14', district: 'Quận 10', province: 'TP.HCM', lat: 10.7908, lng: 106.6702 },
    { address: 'Đường Hòa Hưng', ward: '14', district: 'Quận 10', province: 'TP.HCM', lat: 10.7892, lng: 106.6608 },
];

const LISTING_TEMPLATES = [
    { label: 'Nhà phố', priceBase: 3_500_000_000, area: 72, desc: 'Nhà phố mặt tiền đường lớn, tiện kinh doanh' },
    { label: 'Đất nền', priceBase: 1_800_000_000, area: 100, desc: 'Đất nền quy hoạch rõ ràng, sổ đỏ chính chủ' },
    { label: 'Chung cư', priceBase: 950_000_000, area: 65, desc: 'Căn hộ chung cư hiện đại, view biển' },
    { label: 'Biệt thự', priceBase: 8_500_000_000, area: 250, desc: 'Biệt thự khu an ninh, đầy đủ tiện nghi' },
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
        console.log('🌱 Seeding mock Đà Nẵng data...');

        let sellerId;
        const existingUser = await client.query(
            `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
            ['0900000000']
        );
        if (existingUser.rows.length > 0) {
            sellerId = existingUser.rows[0].id;
        } else {
            const sellerResult = await client.query(
                `INSERT INTO users (phone, full_name, role, is_active)
         VALUES ($1, $2, 'agent', true)
         RETURNING id`,
                ['0900000000', 'Người bán mẫu']
            );
            sellerId = sellerResult.rows[0].id;
        }

        let totalLands = 0;
        let totalListings = 0;

        for (const land of LANDS) {
            const slug = slugify(`${land.address}-${land.district}`);
            const lat = land.lat + randomBetween(-0.001, 0.001);
            const lng = land.lng + randomBetween(-0.001, 0.001);

            const existingLand = await client.query(
                `SELECT id FROM lands WHERE slug = $1 LIMIT 1`,
                [slug]
            );

            let landId;
            if (existingLand.rows.length > 0) {
                landId = existingLand.rows[0].id;
                await client.query(
                    `UPDATE lands SET lat = $1, lng = $2, address = $3, ward = $4, district = $5, province = $6,
                          area_m2 = $7, land_type = $8, legal_status = $9, updated_at = NOW()
           WHERE id = $10`,
                    [
                        lat, lng,
                        land.address, land.ward, land.district, land.province,
                        randomBetween(60, 280),
                        'residential',
                        'so_do',
                        landId,
                    ]
                );
            } else {
                const landResult = await client.query(
                    `INSERT INTO lands (lat, lng, address, ward, district, province, slug, area_m2, land_type, legal_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
                    [
                        lat, lng,
                        land.address, land.ward, land.district, land.province,
                        slug,
                        randomBetween(60, 280),
                        'residential',
                        'so_do',
                    ]
                );
                landId = landResult.rows[0].id;
            }
            totalLands += 1;

            const numListings = Math.floor(randomBetween(2, 5));
            for (let i = 0; i < numListings; i += 1) {
                const template = LISTING_TEMPLATES[i % LISTING_TEMPLATES.length];
                const priceMult = randomBetween(0.8, 1.3);
                const price = Math.round(template.priceBase * priceMult / 1_000_000) * 1_000_000;
                const area = Math.round(template.area * randomBetween(0.85, 1.25));
                const pricePerM2 = area > 0 ? Math.round(price / area) : null;

                await client.query(
                    `INSERT INTO listings
             (land_id, seller_id, title, description, price, area, price_per_m2,
              source, status, listing_type, contact_name, contact_phone, images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        landId,
                        sellerId,
                        `${template.label} ${land.address}, ${land.district}`,
                        template.desc,
                        price,
                        area,
                        pricePerM2,
                        'mock',
                        'active',
                        'sale',
                        'Chủ nhà',
                        `09${Math.floor(10000000 + Math.random() * 90000000)}`,
                        JSON.stringify([]),
                    ]
                );
                totalListings += 1;
            }
            console.log(`  ✅ ${land.address}, ${land.district} → ${numListings} listings`);
        }

        console.log(`\n✅ Seed complete: ${totalLands} lands, ${totalListings} listings inserted.`);
        console.log(`Seller user: 0900000000`);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
