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
        type: { 
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'] 
        },
        coordinates: [Number]
    }
});
storeHistorySchema.index({locationStore: "2dsphere" });
module.exports = mongoose.model("storeHistory", storeHistorySchema);
