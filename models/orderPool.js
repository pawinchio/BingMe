var mongoose    = require("mongoose");

// SCHEMA SETUP
var orderPoolSchema = new mongoose.Schema({
    locationEater: {Latitude : String,Longitude : String},
    storeName: String,
    eaterID:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Eater"
    },
    menu: [{name: String,amount: Number}],
    storeId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "storeHistory"
    },
    storeLocation: {
        type: { type: String },
        coordinates: []
    },
    fee: String,
    isPickup: Boolean,
    hunterID:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hunter"
    },
    locationHunter: {Latitude : String,Longitude : String},
    isPaidFee: Boolean,
    feePaidTime: String,
    isFullFilled: Boolean,
    qr: String,
    isComplete: Boolean,
    dateCreated: String    
});

orderPoolSchema.index({storeLocation: "2dsphere" });
module.exports = mongoose.model("orderPool", orderPoolSchema);
