const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

router.get("/", async (req, res) => {

    const categories = [
        "Mountain",
        "Seabeach",
        "Forest",
        "Desert",
        "Snow",
        "Adventure"
    ];

    const listingsByCategory = {};

    for (let cat of categories) {
        listingsByCategory[cat] = await Listing.find({ category: cat }).limit(4);
    }

    res.render("experiences/index", { listingsByCategory });
});

module.exports = router;
