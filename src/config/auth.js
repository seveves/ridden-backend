const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const jwt = require('jsonwebtoken');
const appConfig = require('./app');
const Rider = require('../models/rider');

module.exports = (passport) => {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  passport.use(
    new GoogleStrategy({
      clientID: appConfig.clientId,
      clientSecret: appConfig.clientKey,
      callbackURL: appConfig.clientCallback
    },
    (token, refreshToken, profile, done) => {
      Rider.findOneOrCreate({
        name: profile.displayName,
        googleId: profile.id
      }, (err, rider) => {
        const payload = { id: rider._id, roles: rider.roles };
        const jwtToken = jwt.sign({ data: payload }, appConfig.secret, { expiresIn: '24h' });
        return done(err, { rider, token: jwtToken });
      });
    })
  );
};