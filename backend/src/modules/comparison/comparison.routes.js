'use strict';

const { Router }   = require('express');
const { optionalAuthenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { query: db } = require('../../config/database');

const { ComparisonController, createComparisonSchema, addListingSchema } =
  require('./comparison.controller');
const ComparisonService    = require('./comparison.service');
const ComparisonRepository = require('./comparison.repository');
const ListingRepository    = require('../listing/listing.repository');
const HeatmapRepository    = require('../heatmap/heatmap.repository');
const BankValuationRepository = require('../bankValuation/bankValuation.repository');

const compRepo   = new ComparisonRepository(db);
const listingRepo = new ListingRepository(db);
const heatmapRepo = new HeatmapRepository(db);
const bvRepo      = new BankValuationRepository(db);
const compService = new ComparisonService(compRepo, listingRepo, heatmapRepo, bvRepo);
const compCtrl    = new ComparisonController(compService);

const router = Router();

router.post('/',              optionalAuthenticate, validate(createComparisonSchema), compCtrl.create);
router.get('/:id',            optionalAuthenticate,                                   compCtrl.get);
router.post('/:id/add',       optionalAuthenticate, validate(addListingSchema),       compCtrl.addListing);
router.delete('/:id/:listingId', optionalAuthenticate,                                compCtrl.removeListing);

module.exports = router;
