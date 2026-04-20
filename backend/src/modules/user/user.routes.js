'use strict';

const { Router }     = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate }   = require('../../middleware/validate');
const { query: db }  = require('../../config/database');

const { UserController, updateMeSchema } = require('./user.controller');
const UserService    = require('./user.service');
const UserRepository = require('./user.repository');
const ListingRepository = require('../listing/listing.repository');

const userRepo    = new UserRepository(db);
const listingRepo = new ListingRepository(db);
const userService = new UserService(userRepo, listingRepo);
const userCtrl    = new UserController(userService);

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/',                   userCtrl.getMe);
router.put('/',   validate(updateMeSchema), userCtrl.updateMe);
router.get('/listings',           userCtrl.getMyListings);
router.get('/saved',              userCtrl.getSaved);
router.post('/saved/:listingId',  userCtrl.saveListing);
router.delete('/saved/:listingId',userCtrl.unsaveListing);

module.exports = router;
