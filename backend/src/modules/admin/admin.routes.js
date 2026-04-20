'use strict';

const { Router }     = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { validate }   = require('../../middleware/validate');
const { query: db }  = require('../../config/database');

const { AdminController, rejectSchema } = require('./admin.controller');
const AdminService    = require('./admin.service');
const ListingRepository = require('../listing/listing.repository');
const LandRepository    = require('../land/land.repository');
const BankValuationRepository = require('../bankValuation/bankValuation.repository');
const { createValuationSchema } = require('../bankValuation/bankValuation.controller');

const listingRepo = new ListingRepository(db);
const landRepo    = new LandRepository(db);
const bvRepo      = new BankValuationRepository(db);
const adminService = new AdminService(listingRepo, landRepo, bvRepo);
const adminCtrl    = new AdminController(adminService);

const router = Router();

// All admin routes require 'admin' role
router.use(authenticate, requireRole('admin'));

router.get('/listings/pending',                adminCtrl.getPendingListings);
router.post('/listings/:id/approve',           adminCtrl.approveListing);
router.post('/listings/:id/reject',  validate(rejectSchema), adminCtrl.rejectListing);
router.get('/lands/duplicates',                adminCtrl.getDuplicateLands);
router.post('/lands/:id/merge/:targetId',      adminCtrl.mergeLands);
router.post('/bank-valuations', validate(createValuationSchema), adminCtrl.createBankValuation);

module.exports = router;
