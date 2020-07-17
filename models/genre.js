var mongoose = require('mongoose');

var { Schema, model } = mongoose;

var genreSchema = new Schema({
    name: {
        type: String,
        minlength: [3, 'Minimum length is 3'],
        maxlength: [100, 'Maximum length is 100'],
        required: true
    }
});

genreSchema.virtual('url').get(function(){
    return '/catalog/genre/' + this._id;
});

module.exports = model('Genre', genreSchema);
