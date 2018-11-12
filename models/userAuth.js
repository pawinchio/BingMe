const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose');

const userAuthSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    phone: Number,
    role: String,
    isFirst: Boolean,
    isActivated: Boolean,
    userDataId: mongoose.Schema.Types.ObjectId

});

userAuthSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserAuth", userAuthSchema);