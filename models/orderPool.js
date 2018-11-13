var mongoose    = require("mongoose");

// SCHEMA SETUP
var orderPoolSchema = new mongoose.Schema({
    locationEater: {Latitude : String,Longitude : String},
    orderID: String,
    eaterID:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Eater"
    },
    menu: [{Menu: String,Count: Number}],
    storeId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "storeHistory"
    },
    fee: Number,
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

module.exports = mongoose.model("orderPool", orderPoolSchema);
