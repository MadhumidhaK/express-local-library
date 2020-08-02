var mongoose = require('mongoose');

var { Schema, model } = mongoose;

var bookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Author',
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    isbn: {
        type: String,
        required: true
    },
    genre: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Genre',
            required: true
        }
    ]
    
});

bookSchema.virtual('url').get(function(){
    return '/catalog/book/'+ this._id;
});

module.exports = model('Book', bookSchema);