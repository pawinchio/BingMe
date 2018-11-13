const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose');

const userActivateSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    code: String
});

userActivateSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserActivation", userActivateSchema);