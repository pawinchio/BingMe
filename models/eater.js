var mongoose    = require("mongoose");

// SCHEMA SETUP
var eaterSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phoneNumber: String,
    gender: String,
    birthday: String,
    picture : String,
    address : String,
    c_dCardNumber : String,
    holderName : String,
    expiration_m : String,
    expiration_y : String,
    cvv : String,
    billingAddress : String,
    email : String,
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
