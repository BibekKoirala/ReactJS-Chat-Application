const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const schema = mongoose.Schema;


const messageSchema = new schema({
    content : {
        type : String,
        required : true
    },
    date : {
        type: Date,
        required : true
    },
    seenBy : {
        type : Boolean,
        default : false
    },
    threadId : {
        type : mongoose.Schema.Types.ObjectId,
        ref  : 'Thread'
    },
    sender : {
        type: ObjectID,
        required : true
    }
});


var messages = mongoose.model('Message', messageSchema);

module.exports = messages;