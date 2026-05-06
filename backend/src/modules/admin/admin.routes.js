'use strict';

const { Router } = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { query: db } = require('../../config/database');

const { AdminController, rejectSchema } = require('./admin.controller');
const AdminService = require('./admin.service');
const ListingRepository = require('../listing/listing.repository');
const LandRepository = require('../land/land.repository');
const BankValuationRepository = require('../bankValuation/bankValuation.repository');
const { createValuationSchema } = require('../bankValuation/bankValuation.controller');

const listingRepo = new ListingRepository(db);
const landRepo = new LandRepository(db);
const bvRepo = new BankValuationRepository(db);
const adminService = new AdminService(listingRepo, landRepo, bvRepo);
const adminCtrl = new AdminController(adminService);

const router = Router();

// All admin routes require 'admin' role
router.use(authenticate, requireRole('admin'));

router.get('/stats', async (req, res, next) => {
    try {
        const [landsResult, listingsResult, activeListingsResult] = await Promise.all([
            db('SELECT COUNT(*)::int AS total FROM lands'),
            db('SELECT COUNT(*)::int AS total FROM listings'),
            db("SELECT COUNT(*)::int AS total FROM listings WHERE status = 'active'")
        ]);

        const stats = {
            lands: landsResult.rows[0].total,
            listings: listingsResult.rows[0].total,
            activeListings: activeListingsResult.rows[0].total,
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
});

router.get('/debug/bbox', async (req, res, next) => {
    try {
        const { bbox } = req.query;
        if (!bbox) {
            return res.status(400).json({ success: false, message: 'bbox parameter required' });
        }

        const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);

        const [landsInBbox, landsWithListings] = await Promise.all([
            db('SELECT COUNT(*)::int AS total FROM lands WHERE ST_X(location::geometry) BETWEEN $1 AND $3 AND ST_Y(location::geometry) BETWEEN $2 AND $4', [minLng, minLat, maxLng, maxLat]),
            db(`
        SELECT COUNT(DISTINCT l.id)::int AS total 
        FROM lands l 
        JOIN listings li ON li.land_id = l.id AND li.status = 'active'
        WHERE ST_X(l.location::geometry) BETWEEN $1 AND $5 
          AND ST_Y(l.location::geometry) BETWEEN $2 AND $6
      `, [minLng, minLat, maxLng, maxLat, maxLng, maxLat])
        ]);

        res.json({
            success: true,
            data: {
                bbox: { minLng, minLat, maxLng, maxLat },
                landsInBbox: landsInBbox.rows[0].total,
                landsWithActiveListings: landsWithListings.rows[0].total
            }
        });
    } catch (err) {
        next(err);
    }
});

router.get('/listings/pending', adminCtrl.getPendingListings);
router.post('/listings/:id/approve', adminCtrl.approveListing);
router.post('/listings/:id/reject', validate(rejectSchema), adminCtrl.rejectListing);
router.get('/lands/duplicates', adminCtrl.getDuplicateLands);
router.post('/lands/:id/merge/:targetId', adminCtrl.mergeLands);
router.post('/bank-valuations', validate(createValuationSchema), adminCtrl.createBankValuation);

module.exports = router;
