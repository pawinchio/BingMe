const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose');

const userAuthSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    isFirst: Boolean,
    isActivated: Boolean,
    userDataId: mongoose.Schema.Types.ObjectId

});

userAuthSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserAuth", userAuthSchema);