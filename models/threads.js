const mongoose = require('mongoose');
const schema = mongoose.Schema;


const threadSchema = new schema({
    last_updated : {
        type: Date,
        required : true
    },
    users : {
        type: Array,
        required : true
    }
});


var threads = mongoose.model('Thread', threadSchema);

module.exports = threads;