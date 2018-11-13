var mongoose    = require("mongoose");

// SCHEMA SETUP
var eaterSchema = new mongoose.Schema({
    FirstName: String,
    LastName: String,
    PhoneNumber: String,
    Gender: String,
    Birthday: String,
    Picture : String,
    Address : String,
    c_dCardNumber : String,
    HolderName : String,
    Expiration_m : String,
    Expiration_y : String,
    CVV : String,
    BillingAddress : String,
    Email : String,
    refStoreHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreHistory"
        }
    ],
    refPending: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderPool"
    },
    refHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orderPool"
        }
    ],
    costTotal : Number,
    discount : Number
});

module.exports = mongoose.model("eater", eaterSchema);
