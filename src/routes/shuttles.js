const express = require('express');
const ics = require('ics');
const router = express.Router();
const mongoose = require('mongoose');
const Shuttle = require('../models/shuttle');
const Rider = require('../models/rider');
const Vendor = require('../models/vendor');
const isVendor = require('../middleware/roles').isVendor;

router.get('/', (req, res, next) => {    
  Shuttle.find((err, shuttles) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      res.json(shuttles);
    }
  });
});

router.post('/', isVendor, (req, res, next) => {
  const data = req.body;
  Shuttle.create({
      ...data,
      departure: new Date(data.departure),
      vendorId: mongoose.Types.ObjectId(data.vendorId),
      carId: mongoose.Types.ObjectId(data.carId)
    },
    (err, shuttle) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        Vendor.findOneAndUpdate({
            _id: shuttle.vendorId,
            riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] }
          }, {
            $push: {
              shuttleIds: shuttle._id
            }
          }, (err, vendor) => {
            if (err) {
              // todo: delete shuttle
              res.status(500).send({ error: err });
            } else {
              if (!vendor) {
                // todo: delete shuttle
                res.sendStatus(404);
                return;
              }
              res.json(shuttle);
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
  Shuttle.findById(id, (err, shuttle) => {
    if (err) {
      res.status(500).send({ error: err });
    } else {
      if (!shuttle) {
        res.sendStatus(404);
        return;
      }
      res.json(shuttle);
    }
  });
});

router.put('/:id', isVendor, (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  const update = req.body;
  Vendor.findOne({
      riderIds: { $in: [mongoose.Types.ObjectId(req.jwtData.id)] },
      shuttleIds: { $in: [mongoose.Types.ObjectId(id)] }
    },
    (err, vendor) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        if (!vendor) {
          res.sendStatus(404);
          return;
        }
        Shuttle.findByIdAndUpdate(id, update, { new: true }, (err, shuttle) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            if (!shuttle) {
              res.sendStatus(404);
              return;
            }
            res.json(shuttle);
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
      shuttleIds: { $in: [mongoose.Types.ObjectId(id)] }
    }, { 
      $pull: { shuttleIds: mongoose.Types.ObjectId(id) }
    },
    (err, vendor) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        if (!vendor) {
          res.sendStatus(404);
          return;
        }
        Shuttle.findByIdAndRemove(id, (err, shuttle) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            if (!shuttle) {
              res.sendStatus(404);
              return;
            }
            res.json(shuttle);
          }
        });
      }
    });
});

router.get('/:id/ical', (req, res, next) => {
  const shuttleId = req.params.id;
  if (!shuttleId) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  Shuttle.findById(shuttleId, (err, shuttle) => {
    if (err || !shuttle) {
      res.status(err ? 500 : 404).send({ error: err || 'Shuttle not found' });
    } else {
      const departure = new Date(shuttle.departure);
      const alarm1 = new Date(
        departure.getFullYear(),
        departure.getMonth(),
        departure.getDate() - 1,
        departure.getHours(),
        departure.getMinutes()
      );
      const alarm2 = new Date(
        departure.getFullYear(),
        departure.getMonth(),
        departure.getDate() ,
        departure.getHours() - 1,
        departure.getMinutes()
      );
      const event = {
        start: [
          departure.getFullYear(),
          departure.getMonth() + 1, 
          departure.getDate(),
          departure.getHours(),
          departure.getMinutes()
        ],
        duration: { hours: shuttle.duration, minutes: 0 },
        title: `Ridden.io: ${shuttle.title}`,
        description: shuttle.description,
        location: shuttle.location.name,
        url: `http://ridden.now.sh/shuttle-details/${shuttle._id}`,
        geo: { lat: shuttle.location.lat, lon: shuttle.location.long },
        alarms: [
          {
            action: 'display',
            trigger: [
              alarm1.getFullYear(),
              alarm1.getMonth() + 1, 
              alarm1.getDate(),
              alarm1.getHours(),
              alarm1.getMinutes()
            ]
          },
          {
            action: 'display',
            trigger: [
              alarm2.getFullYear(),
              alarm2.getMonth() + 1, 
              alarm2.getDate(),
              alarm2.getHours(),
              alarm2.getMinutes()
            ]
          }
        ]
      };
      ics.createEvent(event, (err, value) => {
        if (err) {
          res.status(500).send({ error: { name: 'CreateEvent', message: 'Unable to create event' } });
        } else {
          res.set('Content-Type', 'text/calendar');
          res.send(value);
        }
      });
    }
  });
});

router.post('/:id/hopon', (req, res, next) => {
  const shuttleId = req.params.id;
  if (!shuttleId) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  const bookingAmount = req.body.amount;
  if (!bookingAmount || bookingAmount < 1) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Booking amount missing' } });
    return;
  }
  const riderId = req.jwtData.id;
  Shuttle.findByIdAndUpdate(
    shuttleId,
    {
      $push: {
        bookings: {
          riderId: mongoose.Types.ObjectId(riderId),
          amount: bookingAmount
        }
      }
    },
    { new: true },
    (err, shuttle) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        Rider.findByIdAndUpdate(
          riderId,
          {
            $addToSet: { shuttleIds: shuttle._id }
          },
          (err, rider) => {
            if (err) {
              res.status(500).send({ error: err });
            } else {
              res.json(shuttle);
            }
          }
        );
      }
    });
});

router.post('/:id/hopoff', (req, res, next) => {
  const shuttleId = req.params.id;
  if (!shuttleId) {
    res.status(500).send({ error: { name: 'InvalidParams', message: 'Id missing' } });
    return;
  }
  const riderId = req.jwtData.id;
  Shuttle.findByIdAndUpdate(
    shuttleId, {
      $pull: {
        bookings: {
          riderId: mongoose.Types.ObjectId(riderId),
        }
      }
    },
    { new: true },
    (err, shuttle) => {
      if (err) {
        res.status(500).send({ error: err });
      } else {
        Rider.findByIdAndUpdate(
          riderId,
          {
            $pull: { shuttleIds: shuttle._id }
          },
          (err, rider) => {
            if (err) {
              res.status(500).send({ error: err });
            } else {
              res.json(shuttle);
            }
          }
        );
      }
    });
});

module.exports = router;
