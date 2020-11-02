const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    memo: {
        type: String
    },
    author: {
        type: String,
        required:true
    },
    created: {
        type: Date,
        default: Date.now
    }
}); 

module.exports = mongoose.model('Task', TaskSchema);