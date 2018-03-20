const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Car = require('../models/car');
const Vendor = require('../models/vendor');
const isVendor = require('../middleware/roles').isVendor;

router.get('/', isVendor, (req, res, next) => {
  Vendor.findOne({ riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] }}, (err, vendor) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!vendor) {
        res.sendStatus(404);
        return;
      }
      Car.find({
        _id: {
          $in: vendor.carIds
        }
      }, (err, cars) => {
        if (err) {
          res.status(500).send({ error: err });
        } else {
          res.json(cars);
        }
      });
    }
  });
});

router.post('/', isVendor, (req, res, next) => {
  const data = req.body;
  if (!data.max || !data.name || data.name.lenth <= 0) {
    res.status(500).send({ error: { name: 'InvalidBody', message: 'Invalid car props.' }});
    return;
  }
  Car.create(data, (err, car) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      Vendor.findOneAndUpdate(
        { riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] } },
        { $push: { carIds: mongoose.Types.ObjectId(car._id) } }, (err, vendor) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            if (!vendor) {
              res.sendStatus(404);
              return;
            }
            res.json(car);
          }
      });
    }
  });
});

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Car.findById(id, (err, car) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.json(car);
    }
  });
});

router.put('/:id', isVendor, (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Vendor.findOne({
      riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] },
      carIds: { $in: [mongoose.Types.ObjectId(id)] }
    },
    (err, vendor) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        if (!vendor) {
          res.sendStatus(404);
          return;
        }
        const update = req.body;
        Car.findByIdAndUpdate(id, update, { new: true }, (err, car) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            res.json(car);
          }
        });
      }
  });
});

router.delete('/:id', isVendor, (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Vendor.findOneAndUpdate({
      riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] },
      carIds: { $in: [mongoose.Types.ObjectId(id)] }
    }, { 
      $pull: { carIds: mongoose.Types.ObjectId(id) }
    },
    (err, vendor) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        if (!vendor) {
          res.sendStatus(404);
          return;
        }
        Car.findByIdAndRemove(id, (err, car) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            res.json(car);
          }
        });
      }
  });
});

module.exports = router;
