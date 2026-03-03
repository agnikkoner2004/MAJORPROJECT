const mongoose = require('mongoose');
const initdata = require('./data.js');
const Listing = require('../models/listing.js');

const MONGODB_URL = "mongodb://127.0.0.1:27017/Stayclave";

async function main() {
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to MongoDB");

    await initDB();

    mongoose.connection.close();
}

main().catch(err => console.log(err));

const initDB = async () => {

    await Listing.deleteMany({});

    // coordinates for known locations
    const coordinates = {

       "New York City": [-74.0060, 40.7128],
"Malibu": [-118.7798, 34.0259],
"Aspen": [-106.8370, 39.1911],
"Florence": [11.2558, 43.7696],
"Cancun": [-86.8515, 21.1619],
"Verbier": [7.2266, 46.0960],
"Serengeti National Park": [34.6857, -2.3333],
"Amsterdam": [4.9041, 52.3676],
"Fiji": [178.0650, -17.7134],
"Cotswolds": [-1.8433, 51.8330],
"Boston": [-71.0589, 42.3601],
"Miami": [-80.1918, 25.7617],
"Phuket": [98.3381, 7.8804],
"Scottish Highlands": [-4.2026, 57.1200],
"Montana": [-110.3626, 46.8797],
"Mykonos": [25.3289, 37.4467],
"Costa Rica": [-83.7534, 9.7489],
"Charleston": [-79.9311, 32.7765],
"Tokyo": [139.6917, 35.6895],
"New Hampshire": [-71.5724, 43.1939],
"Maldives": [73.2207, 3.2028]

    };

    const modifiedData = initdata.data.map((obj) => {

      const coords = coordinates[obj.location.trim()] || coordinates[obj.location.replace(" City", "")] || [77.2090, 28.6139];


        // ✅ automatic category detection
        let category = "City";

        if ([
            "Manali", "Shimla", "Darjeeling", "Banff", "Zermatt"
        ].includes(obj.location)) {
            category = "Mountain";
        }

        else if ([
            "Goa", "Maldives", "Santorini", "Bali", "Sydney",
            "Pondicherry", "Gokarna", "Kovalam", "Havelock Island"
        ].includes(obj.location)) {
            category = "Seabeach";
        }

        else if ([
            "Dubai"
        ].includes(obj.location)) {
            category = "Desert";
        }

        else if ([
            "Ooty", "Wayanad", "Jim Corbett", "Munnar"
        ].includes(obj.location)) {
            category = "Forest";
        }

        else if ([
            "Rishikesh"
        ].includes(obj.location)) {
            category = "Adventure";
        }

        else if ([
            "Shimla", "Manali", "Tromsø"
        ].includes(obj.location)) {
            category = "Snow";
        }

        return {

            ...obj,

            category: category,

            owner: "69820a0d1b0fdb5fa4ef6b36",

            geometry: {
                type: "Point",
                coordinates: coords
            }

        };

    });

    await Listing.insertMany(modifiedData);

    console.log("Database initialized successfully with ALL listings");

};

