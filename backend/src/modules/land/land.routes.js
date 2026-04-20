'use strict';

const { Router }   = require('express');
const { cacheMiddleware, TTL } = require('../../middleware/cache');
const { query: db } = require('../../config/database');

const LandController       = require('./land.controller');
const LandService          = require('./land.service');
const LandRepository       = require('./land.repository');
const BankValuationRepository = require('../bankValuation/bankValuation.repository');

const landRepo = new LandRepository(db);
const bvRepo   = new BankValuationRepository(db);
const landService = new LandService(landRepo, bvRepo);
const landCtrl    = new LandController(landService);

const router = Router();

router.get('/',                    cacheMiddleware(TTL.lands),   landCtrl.getLands);
router.get('/:id',                 cacheMiddleware(TTL.land),    landCtrl.getLandById);
router.get('/:id/price-history',   cacheMiddleware(TTL.land),    landCtrl.getPriceHistory);
router.get('/:id/nearby',          cacheMiddleware(TTL.land),    landCtrl.getNearby);
router.get('/:id/bank-valuations', cacheMiddleware(TTL.land),    landCtrl.getBankValuations);

module.exports = router;
