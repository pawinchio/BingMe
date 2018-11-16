var mongoose    = require("mongoose");

// SCHEMA SETUP
var storeHistorySchema = new mongoose.Schema({
    img: String,
    storeName: String,
    historyMenu:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
    }],
    priceAvg: Number,
    COPAvg: Number,
    locationStore: {
<<<<<<< HEAD
        type: { 
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'] 
        },
=======
        type: { type: String },
>>>>>>> 2f7573e9235fdf6dcb936da3f10f7428c1fccf96
        coordinates: [Number]
    }
});
storeHistorySchema.index({locationStore: "2dsphere" });
module.exports = mongoose.model("storeHistory", storeHistorySchema);
