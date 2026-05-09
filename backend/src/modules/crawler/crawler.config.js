'use strict';

const crawlerConfig = {
  enabled:        process.env.CRAWLER_ENABLED !== 'false',
  cronSchedule:   process.env.CRAWLER_CRON    || '0 3 * * *',
  requestDelayMs: parseInt(process.env.CRAWLER_DELAY_MS, 10) || 2000,
  maxPagesPerRun: parseInt(process.env.CRAWLER_MAX_PAGES,  10) || 5,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  locations: [
    { district: 'Quận 1',        province: 'TP.HCM', regionV2: 13000, areaV2: 13101 },
    { district: 'Quận 3',        province: 'TP.HCM', regionV2: 13000, areaV2: 13103 },
    { district: 'Quận 7',        province: 'TP.HCM', regionV2: 13000, areaV2: 13105 },
    { district: 'Quận 12',       province: 'TP.HCM', regionV2: 13000, areaV2: 13107 },
    { district: 'Quận Gò Vấp',   province: 'TP.HCM', regionV2: 13000, areaV2: 13110 },
    { district: 'Thủ Đức',       province: 'TP.HCM', regionV2: 13000, areaV2: 13119 },
    { district: 'Bình Chánh',    province: 'TP.HCM', regionV2: 13000, areaV2: 13115 },
  ],

  sources: {
    nhatot: {
      enabled:  process.env.CRAWLER_NHATOT_ENABLED !== 'false',
      name:     'Chợ Tốt Nhà',
      baseUrl:  'https://gateway.chotot.com/v1/public/ad-listing',
      type:     'api',
      params: {
        cg:    1000,
        st:    's,k',
        limit: 20,
      },
    },

    batdongsan: {
      enabled: false, // bị 403, tắt tạm
      name:     'BatDongSan.com.vn',
      baseUrl:  'https://batdongsan.com.vn',
      type:     'html',
      searchPath: '/nha-dat-ban',
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
