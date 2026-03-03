const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utils/wrapAsync.js');
const Listing = require('../models/listing.js');
const { isloggedin, isOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer  = require('multer')
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });


//index route to show all listings

router
.route('/')
.get( wrapAsync(listingController.index))
// .post(isloggedin, validateListing, wrapAsync(listingController.createListing));
.post(isloggedin, validateListing, upload.single('image'), 
	
  wrapAsync(listingController.createListing));

// New route to create a sample listing
router.get('/new', isloggedin,listingController.renderNewForm);

router.get("/trending", listingController.trendingListings);




// Show, Update, Delete routes for a specific listing
router.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isloggedin, isOwner, upload.single('image'),validateListing, wrapAsync(listingController.updateListing))
.delete(isloggedin, isOwner, wrapAsync(listingController.destroyListing));


//Create route to handle form submission
// router.post('/listings', isloggedin, validateListing, wrapAsync(listingController.createListing));




// Edit route
router.get('/:id/edit', isloggedin, isOwner, wrapAsync(listingController.editListing));

module.exports = router;