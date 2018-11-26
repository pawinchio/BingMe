const   mongoose = require('mongoose');

const userActivateSchema = new mongoose.Schema({
    userId: String,
    code: String
});

module.exports = mongoose.model("UserActivation", userActivateSchema);