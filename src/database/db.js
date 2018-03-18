const mongoose = require('mongoose');
const appConfig = require('../config/app.js');

process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0); 
  }); 
});

mongoose.Promise = global.Promise;
const db = mongoose.createConnection(appConfig.mongodb);

module.exports = db;