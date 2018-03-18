const express = require('express');
const router = express.Router();
const Rider = require('../models/rider');
const appConfig = require('../config/app');

module.exports = (passport) => {
  router.get('/', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile']
  }));
  
  router.get('/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      Rider.findById(req.user.rider._id,
        (err, rider) => {
          if (err) {
            res.status(500).send({ error: err });
          } else {
            res.redirect(`${appConfig.frontend}/login/${Buffer.from(req.user.token).toString('base64')}`);
          }
        });
    }
  );

  return router;
};
