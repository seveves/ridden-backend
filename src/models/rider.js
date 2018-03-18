const db = require('../database/db');
const Schema = require('mongoose').Schema;

const RiderSchema = new Schema({
  name: { type: String, required: true },
  mail: { type: String, unique: true },
  shuttleIds: [Schema.Types.ObjectId],
  googleId: { type: String, unique: true },
  roles: [String],
  createdAt: { type: Date, default: Date.now }
});

RiderSchema.statics.findOneOrCreate = function findOneOrCreate(condition, callback) {
  const self = this;
  self.findOne(condition, (err, result) => {
    return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) });
  });
}

module.exports = db.model('Rider', RiderSchema);
