var mongoose    = require("mongoose");

// SCHEMA SETUP
var eaterPicSchema = new mongoose.Schema({
    fieldname: String,
    originalname: String,
    name: String,
    encoding: String,
    mimetype: String,
    path : String,
    extension : String,
    size : String,
    truncated : String,
    buffer : String
});

module.exports = mongoose.model("eaterPic", eaterPicSchema);




 