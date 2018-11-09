var mongoose    = require("mongoose");
mongoose.connect("mongodb://localhost/Bingme", { useNewUrlParser: true });


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
    Expiration : String,
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
        ref: "StoreHistory"
    },
    refHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreHistory"
        }
    ],
    costTotal : Number,
    discount : Number
});

module.exports = mongoose.model("Eater", eaterSchema);
