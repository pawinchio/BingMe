var mongoose = require("mongoose");
var Eater  = require("./models/eater");
 
var data = [
    {
    FirstName: "Boy",
    LastName: "Eiei",
    PhoneNumber: "0000000000",
    Gender: "Man",
    Birthday: "7/8/9",
    Picture : "https://www.prachachat.net/wp-content/uploads/2018/09/201701255931-1-1.jpg",
    Address : "Home",
    c_dCardNumber : "0412",
    HolderName : "SADS",
    Expiration : "7/8/9",
    CVV : "245",
    BillingAddress : "Home",
    Email : "bb@mail.com",
    costTotal : 8000,
    discount : 100
    }
];
 
function seedDB(){

    data.forEach(function(seed){
        Eater.create(seed)
    });

};

module.exports = seedDB;