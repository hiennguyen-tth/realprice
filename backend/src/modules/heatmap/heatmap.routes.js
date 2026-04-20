'use strict';

const { Router }   = require('express');
const { cacheMiddleware, TTL } = require('../../middleware/cache');
const { query: db } = require('../../config/database');

const HeatmapController  = require('./heatmap.controller');
const HeatmapService     = require('./heatmap.service');
const HeatmapRepository  = require('./heatmap.repository');

const heatmapRepo = new HeatmapRepository(db);
const heatmapService = new HeatmapService(heatmapRepo);
const heatmapCtrl    = new HeatmapController(heatmapService);

const router = Router();

router.get('/',                     cacheMiddleware(TTL.heatmap), heatmapCtrl.getHeatmap);
router.get('/district/:district',   cacheMiddleware(TTL.heatmap), heatmapCtrl.getDistrict);
router.get('/ward/:ward',           cacheMiddleware(TTL.heatmap), heatmapCtrl.getWard);

module.exports = router;
