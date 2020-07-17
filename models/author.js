var mongoose = require('mongoose');
var moment = require('moment');

var { Schema, model } = mongoose;

const authorSchema = new Schema({
    first_name: {
        type: String,
        maxlength: [100, 'Maximum length is 100'],
        required: true
    },
    last_name: {
        type: String,
        maxlength: [100, 'Maximum length is 100'],
        required: true
    },
    date_of_birth: Date,
    date_of_death: Date
})

//https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose

authorSchema.virtual('name').get(function(){
    var fullname = '';
    if(this.first_name && this.last_name){
        fullname = this.first_name + ' ' + this.last_name; 
    }
    if(!this.first_name || !this.last_name){
        fullname = '';
    };
    return fullname;
});

authorSchema.virtual('lifespan').get(function(){
    if(this.date_of_death && this.date_of_birth){
        return (this.date_of_death.getYear() -  this.date_of_birth.getYear()).toString();
    }else{
        if(this.date_of_birth){
            return 'Born on ' + this.date_of_birth.getYear()
        }else{
            return 'No Details found'
        }
    }
});

authorSchema.virtual('url').get(function(){
    return '/catalog/author/'+ this._id;
});

authorSchema.virtual('date_of_birth_formatted').get(function(){
    return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
});

authorSchema.virtual('date_of_death_formatted').get(function(){
    return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
});



module.exports = model('Author', authorSchema);