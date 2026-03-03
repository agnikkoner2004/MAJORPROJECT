const Listing = require('../models/listing');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const { location, price } = req.query;

    let filter = {};

    if (location) {
        filter.location = { $regex: location, $options: "i" };
    }

    if (price) {
        filter.price = { $lte: price };
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings });
};



module.exports.renderNewForm = (req, res) => {
   
    res.render('listings/new.ejs');
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },   // increase views by 1
        { new: true }
    )
    .populate({ path: 'reviews', populate: { path: 'author' } })
    .populate('owner');

    if (!listing) {
        req.flash("error", "We couldn't find the listing you were looking for!");
        return res.redirect('/listings');
    }

    res.render('listings/show.ejs', { listing });
};

module.exports.trendingListings = async (req, res) => {
    const listings = await Listing.find({})
        .sort({ views: -1 })   // Highest views first
        .limit(12);           // Top 12 only

    res.render("listings/trending", { listings });
};

module.exports.createListing = async (req, res) => {

   let response;
   try {
       response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();
   } catch (err) {
       console.error("Geocoding error:", err);
       req.flash("error", "Error geocoding location. Please try again.");
       return res.redirect("/listings/new");
   }

    if (!response.body.features || !response.body.features.length) {
        req.flash("error", "Invalid location. Please enter a valid place.");
        return res.redirect("/listings/new");
    }

    const geometry = response.body.features[0].geometry;
    if (!geometry || !geometry.coordinates || geometry.coordinates[0] === 0 && geometry.coordinates[1] === 0) {
        req.flash("error", "Geocoding returned invalid coordinates. Please try a more specific location.");
        return res.redirect("/listings/new");
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    newListing.geometry = geometry;

    try {
        await newListing.save();
    } catch (err) {
        if (err.errors && err.errors['geometry.coordinates']) {
            req.flash("error", "Invalid location coordinates. Please enter a specific, valid place.");
            return res.redirect("/listings/new");
        }
        throw err;
    }

    req.flash("success", "New Listing Created!");
    res.redirect('/listings');
};


module.exports.editListing= async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "We couldn't find the listing you were looking for!");
        return res.redirect('/listings');
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render('listings/edit.ejs', { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send Valid Listing Data");
    }

    let { id } = req.params;

    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to edit this listing!");
        return res.redirect(`/listings/${id}`);
    }

    // update text fields
    listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    // update coordinates if location changed
    if (req.body.listing.location) {
        try {
            let response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            }).send();

            if (!response.body.features || !response.body.features.length) {
                req.flash("error", "Invalid location. Please enter a valid place.");
                return res.redirect(`/listings/${id}/edit`);
            }

            const geometry = response.body.features[0].geometry;
            if (!geometry || !geometry.coordinates || (geometry.coordinates[0] === 0 && geometry.coordinates[1] === 0)) {
                req.flash("error", "Geocoding returned invalid coordinates. Please try a more specific location.");
                return res.redirect(`/listings/${id}/edit`);
            }

            listing.geometry = geometry;
        } catch (err) {
            console.error("Geocoding error:", err);
            req.flash("error", "Error geocoding location. Please try again.");
            return res.redirect(`/listings/${id}/edit`);
        }
    }

    // update image if new file uploaded
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing= async (req, res) => {
    let { id } = req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    console.log("Deleted listing:", deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect('/listings');
};