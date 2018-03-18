const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Rider = require('../models/rider');
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
      res.json(rider);
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
