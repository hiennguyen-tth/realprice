'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const { runCrawl } = require('../src/modules/crawler/crawler.service');

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
  try {
    console.log('Starting local crawl → Supabase production...');
    const result = await runCrawl(client);
    console.log('Done:', result);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
