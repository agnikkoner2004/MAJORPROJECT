const mongoose = require('mongoose');
const review = require('./review.js');
const Schema = mongoose.Schema;

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        filename: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["Mountain", "Seabeach", "Forest", "Desert", "Snow", "Adventure", "City"],
        required: true
    },
    reviews: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Review'
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function(coords) {
                    return !(coords[0] === 0 && coords[1] === 0);
                },
                message: 'Invalid coordinates. Please enter a valid location.'
            }
        }
    },
    views: {
        type: Number,
        default: 0
    }
});

listingSchema.post('findOneAndDelete', async (listing) => {
    if(listing){
        await review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;