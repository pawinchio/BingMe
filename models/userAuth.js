const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose');

const userAuthSchema = new mongoose.Schema({
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true,
        auto: true
    },
    username: String,
    password: String
});

userAuthSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserAuth", userAuthSchema);