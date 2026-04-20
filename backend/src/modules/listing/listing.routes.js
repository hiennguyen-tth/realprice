'use strict';

const { Router }       = require('express');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth');
const { validate }     = require('../../middleware/validate');
const { contactLimiter } = require('../../middleware/rateLimit');
const { query: db }    = require('../../config/database');

const {
  ListingController,
  createListingSchema,
  updateListingSchema,
  boostSchema,
  uploadUrlSchema,
} = require('./listing.controller');
const ListingService    = require('./listing.service');
const ListingRepository = require('./listing.repository');
const LandService       = require('../land/land.service');
const LandRepository    = require('../land/land.repository');
const BankValuationRepository = require('../bankValuation/bankValuation.repository');
const { LeadController, createLeadSchema } = require('../lead/lead.controller');
const LeadService       = require('../lead/lead.service');
const LeadRepository    = require('../lead/lead.repository');

// Wire up
const landRepo    = new LandRepository(db);
const bvRepo      = new BankValuationRepository(db);
const landService = new LandService(landRepo, bvRepo);
const listingRepo = new ListingRepository(db);
const listingService = new ListingService(listingRepo, landService);
const listingCtrl    = new ListingController(listingService);

const leadRepo    = new LeadRepository(db);
const leadService = new LeadService(leadRepo, listingRepo);
const leadCtrl    = new LeadController(leadService);

const router = Router();

router.get('/',              optionalAuthenticate,                          listingCtrl.getListings);
router.post('/',             authenticate, validate(createListingSchema),   listingCtrl.createListing);
router.post('/upload-url',   authenticate, validate(uploadUrlSchema),       listingCtrl.getUploadUrl);
router.get('/:id',           optionalAuthenticate,                          listingCtrl.getListingById);
router.put('/:id',           authenticate, validate(updateListingSchema),   listingCtrl.updateListing);
router.delete('/:id',        authenticate,                                  listingCtrl.deleteListing);
router.post('/:id/boost',    authenticate, validate(boostSchema),           listingCtrl.boostListing);
router.post('/:id/contact',  contactLimiter, validate(createLeadSchema),    leadCtrl.createLead);
router.get('/:id/similar',                                                  listingCtrl.getSimilar);

module.exports = router;
