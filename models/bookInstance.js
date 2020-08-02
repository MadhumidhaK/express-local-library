var mongoose = require('mongoose');
var moment = require('moment');

var { Schema, model } = mongoose;

var bookInstanceSchema = new Schema({
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    imprint: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
        default:"Maintenance"
    },
    due_back: {
        type: Date,
        default: Date.now(),
        required: function(){
            return this.status !== "Available"
        }
    }
});


bookInstanceSchema.virtual('url').get(function(){
    return '/catalog/bookinstance/' + this._id;
});

bookInstanceSchema.virtual('due_back_formatted').get(function(){
    return moment(this.due_back).format('YYYY-MM-DD');
});

bookInstanceSchema.virtual('due_back_formatted_m_D_Y').get(function(){
    return moment(this.due_back).format('MMMM Do, YYYY');
});

module.exports = model('BookInstance', bookInstanceSchema);