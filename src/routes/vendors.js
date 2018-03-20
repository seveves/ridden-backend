const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Vendor = require('../models/vendor');
const Car = require('../models/car');
const Shuttle = require('../models/shuttle');
const roles = require('../middleware/roles');

router.get('/', (req, res, next) => {
  Vendor.find((err, vendors) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.json(vendors);
    }
  });
});

router.post('/', roles.isAdmin, (req, res, next) => {
  const data = req.body;
  Vendor.create(data, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.json(vendor);
    }
  });
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Vendor.findById(id, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.json(vendor);
    }
  });
});

router.put('/:id', roles.isVendor, (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Vendor.findById(id, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!vendor) {
        res.sendStatus(404);
        return;
      }
      if (vendor.riderIds.some(riderId => mongoose.Types.ObjectId(req.jwtData.id).equals(vendor.riderId))) {
        const update = req.body;
        Vendor.findByIdAndUpdate(id, update, { new: true }, (err, doc) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            res.json(doc);
          }
        });
      } else {
        res.status(403).send({ error: { name: 'NotYou', message: 'Cannot update anothers profile' } });
      }
    }
  });
});

router.delete('/:id', roles.isVendor, (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Vendor.findById(id, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (vendor.riderIds.some(riderId => mongoose.Types.ObjectId(req.jwtData.id).equals(vendor.riderId))) {
        Vendor.findByIdAndRemove(id, (err, doc) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            res.json(doc);
          }
        });
      } else {
        res.status(403).send({ error: { name: 'NotYou', message: 'Cannot update anothers profile' } });
      }
    }
  });
});

router.get('/:id/cars', (req, res, next) => {
  const id = req.params.id;
  Vendor.findById(id, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!vendor) {
        res.sendStatus(404);
        return;
      }
      const carIds = vendor.carIds.map(c => mongoose.Types.ObjectId(c));
      Car.find({ _id: { $in: carIds } }, (err, cars) => {
        if (err) {
          res.status(500).send({ error: err });
        } else {
          res.json(cars);
        }
      });
    }
  });
});

router.get('/:id/shuttles', (req, res, next) => {
  const id = req.params.id;
  Vendor.findById(id, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!vendor) {
        res.sendStatus(404);
        return;
      }
      const shuttleIds = vendor.shuttleIds.map(s => mongoose.Types.ObjectId(s));
      Shuttle.find({ _id: { $in: shuttleIds } }, (err, shuttles) => {
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
