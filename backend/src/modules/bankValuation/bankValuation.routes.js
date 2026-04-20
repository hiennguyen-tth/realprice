'use strict';

const { Router }   = require('express');
const { cacheMiddleware, TTL } = require('../../middleware/cache');
const { query: db } = require('../../config/database');

const { BankValuationController } = require('./bankValuation.controller');
const BankValuationService    = require('./bankValuation.service');
const BankValuationRepository = require('./bankValuation.repository');
const LandRepository          = require('../land/land.repository');

const bvRepo   = new BankValuationRepository(db);
const landRepo = new LandRepository(db);
const bvService = new BankValuationService(bvRepo, landRepo);
const bvCtrl    = new BankValuationController(bvService);

const router = Router();

router.get('/',        cacheMiddleware(300), bvCtrl.getValuations);
router.get('/compare', cacheMiddleware(300), bvCtrl.compareForLand);

module.exports = router;
