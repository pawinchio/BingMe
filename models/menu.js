var mongoose    = require("mongoose");

// SCHEMA SETUP
var menuSchema = new mongoose.Schema({
    img: String,
    Name: String,
    priceAvg: Number,
    COPAvg: Number  
});

module.exports = mongoose.model("menu", menuSchema);
