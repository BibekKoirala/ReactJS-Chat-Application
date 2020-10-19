const mongoose = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new schema({
    email : {
        type: String,
        required : true
    },
    designation : {
        type: String,
        required : true
    },
    status : {
        type : String,
        enum : ['online' , 'offline' , 'sleep' , 'donotdisturb'] ,
        required : true
    },
    company : {
        type : String,
        required : true
    },
    threads : {
        type: Array
    },
    admin : {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);

var users = mongoose.model('User', userSchema);

module.exports = users;