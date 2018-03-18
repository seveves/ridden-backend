const db = require('../database/db');
const Schema = require('mongoose').Schema;

const ShuttleSchema = new Schema({
  departure: { type: Date, required: true },
  location: {
    type: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      long: { type: Number, required: true }
    },
    required: true
  },
  title: { type: String, required: true },
  description: String,
  type: String,
  duration: { type: Number, required: true },
  max: { type: Number, required: true },
  min: { type: Number, required: true },
  vendorId: { type: Schema.Types.ObjectId, required: true },
  bookings: [{ riderId: Schema.Types.ObjectId, amount: Number }],
  carId: Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

module.exports = db.model('Shuttle', ShuttleSchema);
