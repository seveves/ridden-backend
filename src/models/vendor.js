const db = require('../database/db');
const Schema = require('mongoose').Schema;

const VendorSchema = new Schema({
  name: { type: String, required: true },
  address: {
    locality: String,
    region: String,
    postalCode: String,
    street: String,
    lat: Number,
    long: Number
  },
  mail: { type: String, unique: true, required: true },
  riderIds: [{ type: Schema.Types.ObjectId, required: true }],
  shuttleIds: [Schema.Types.ObjectId],
  carIds: [Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now }
});

module.exports = db.model('Vendor', VendorSchema);
