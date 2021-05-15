var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var user = new Schema({
    admin: {
        type: Boolean,
        default: false
    }
});

user.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', user);