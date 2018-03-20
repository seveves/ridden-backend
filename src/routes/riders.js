const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Rider = require('../models/rider');
const Vendor = require('../models/vendor');
const Shuttle = require('../models/shuttle');

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Rider.findById(id, (err, rider) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!rider) {
        res.sendStatus(404);
        return;
      }
      if (rider.roles.indexOf('vendor') !== -1) {
        Vendor.findOne({ riderIds:{ $in: [mongoose.Types.ObjectId(id)] } }, (err, vendor) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            if (!vendor) {
              res.sendStatus(404);
              return;
            }
            res.json({ ...(rider.toObject()), vendorId: vendor._id });
          }
        });
      } else {
        res.json(rider);
      }
    }
  });
});

router.get('/:id/shuttles', (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Rider.findById(id, (err, rider) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!rider) {
        res.sendStatus(404);
        return;
      }
      Shuttle.find({ _id: { $in: rider.shuttleIds.map(s => mongoose.Types.ObjectId(s)) } }, (err, shuttles) => {
        if (err) {
          res.status(500).send({ error: err });
        } else {
          res.json(shuttles);
        }
      });
    }
  });
});

module.exports = router;
