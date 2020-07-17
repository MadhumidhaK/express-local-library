var mongoose = require('mongoose');

var DB_URI = process.env.DB_URI;


//Set up default mongoose connection
mongoose.connect(DB_URI, {
    useNewUrlParser: true
});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = db;