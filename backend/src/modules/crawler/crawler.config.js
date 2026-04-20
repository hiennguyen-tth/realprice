'use strict';

/**
 * Crawler configuration — edit this file to add/remove sources or change schedules.
 * Each source defines how to crawl a particular real estate website.
 */
const crawlerConfig = {
  // Global settings
  enabled:        process.env.CRAWLER_ENABLED !== 'false',
  cronSchedule:   process.env.CRAWLER_CRON    || '0 3 * * *', // 03:00 daily
  requestDelayMs: parseInt(process.env.CRAWLER_DELAY_MS, 10) || 2000,
  maxPagesPerRun: parseInt(process.env.CRAWLER_MAX_PAGES,  10) || 5,
  userAgent: 'Mozilla/5.0 (compatible; RealPriceBot/1.0; +https://realprice.vn/bot)',

  // Target locations to crawl (district + province combos)
  locations: (process.env.CRAWLER_LOCATIONS || 'Hải Châu,Đà Nẵng;Sơn Trà,Đà Nẵng;Ngũ Hành Sơn,Đà Nẵng')
    .split(';')
    .map(loc => {
      const [district, province] = loc.split(',').map(s => s.trim());
      return { district, province: province || 'Đà Nẵng' };
    }),

  sources: {
    nhatot: {
      enabled:  process.env.CRAWLER_NHATOT_ENABLED !== 'false',
      name:     'Chợ Tốt Nhà',
      baseUrl:  'https://gateway.chotot.com/v1/public/ad-listing',
      // Uses JSON API — no HTML scraping needed
      type:     'api',
      // category_id 1000: nhà đất
      params: {
        cg:       1000,   // category: real estate
        st:       's,k',  // status: selling, new
        limit:    20,
        page:     1,
      },
      // Map nhatot fields → our schema
      fieldMap: {
        title:          'subject',
        price:          'price',
        area:           'size',
        address:        'region_name',
        district:       'area_name',
        province:       'region_name',
        lat:            'latitude',
        lng:            'longitude',
        images:         'images',
        contactName:    'account_name',
        sourceUrl:      'list_id',
      },
    },

    batdongsan: {
      enabled:  process.env.CRAWLER_BDS_ENABLED !== 'false',
      name:     'BatDongSan.com.vn',
      baseUrl:  'https://batdongsan.com.vn',
      type:     'html',
      searchPath: '/nha-dat-ban',
      // CSS selectors for scraping
      selectors: {
        listContainer:  '.js__card-list',
        item:           '.js__card',
        title:          '.js__card-title',
        price:          '.re__card-config-price',
        area:           '.re__card-config-area',
        address:        '.re__card-location',
        image:          '.js__card-thumbnail img',
        link:           '.js__product-link',
      },
    },
  },
};

module.exports = crawlerConfig;
