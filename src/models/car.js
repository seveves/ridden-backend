const db = require('../database/db');
const Schema = require('mongoose').Schema;

const CarSchema = new Schema({
  max: { type: Number, required: true },
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }  
});

module.exports = db.model('Car', CarSchema);
