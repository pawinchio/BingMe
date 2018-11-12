var mongoose    = require("mongoose");

// SCHEMA SETUP
var storeHistorySchema = new mongoose.Schema({
    img: String,
    locationStore: {Latitude : String,Longitude : String},
    storeName: String,
    historyMenu:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
    }],
    priceAvg: Number,
    COPAvg: Number  
});

module.exports = mongoose.model("storeHistory", storeHistorySchema);
