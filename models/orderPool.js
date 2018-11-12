var mongoose    = require("mongoose");

// SCHEMA SETUP
var orderPoolSchema = new mongoose.Schema({
    locationStore: {Latitude : String,Longitude : String},
    locationEater: {Latitude : String,Longitude : String},
    OrderID: String,
    EaterID:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EaterID"
    },
    HunterID:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HunterID"
    },
    isPickup: Boolean,
    Menu: [{Menu: String,Count: Number}],
    Fee: Number,
    isPaidFee: Boolean,
    FeePaidTime: String,
    isFullFilled: Boolean,
    Qr: String,
    isComplete: Boolean,
    DateCreated: String    
});

module.exports = mongoose.model("orderPool", orderPoolSchema);
