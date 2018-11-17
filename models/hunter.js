var mongoose    = require("mongoose");

// SCHEMA SETUP
var hunterSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    birthday: String,
    address : String,
    phoneNumber: String,
    gender: String,
    birthday: String,
    serviceArea: String,
    citizenID: String,
    idCardImg: String,
    driverLicenseNo: String,
    driverLicenseImg: String,
    vehicleType: String,
    vehicleImg: String,
    operationDay: String,
    operationTime: String,
    picture: String,
    bankAccountNo: String,
    bankName: String,
    billingAddress : String,
    email : String,
    isAppove: String,
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
    money : Number,
    withdrawHistory : [
        {
            date: String,
            money: Number,
        }
    ]
});

module.exports = mongoose.model("hunter", hunterSchema);
