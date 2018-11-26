var mongoose    = require("mongoose");

// SCHEMA SETUP
var eaterPicSchema = new mongoose.Schema({
    name: String,
    path : String
    
});

module.exports = mongoose.model("eaterPic", eaterPicSchema);




 