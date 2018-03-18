const express = require('express');
const cors = require('cors');
const compression = require('compression'); 
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const auth = require('./config/auth');
const appConfig = require('./config/app');
const Rider = require('./models/rider');

const app = express();
app.options('*', cors())
app.use(cors());

auth(passport);
app.use(passport.initialize());

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(errorHandler);

const ROUTE_PREFIX = '/api/v1';

app.use('/auth/google', require('./routes/google-auth')(passport));
app.get(`${ROUTE_PREFIX}/logout`, (req, res) => {
  req.logout();
  req.jwtData = null;
  res.sendStatus(200);
});

app.use(`${ROUTE_PREFIX}/cars`, isAuthenticated, require('./routes/cars'));
app.use(`${ROUTE_PREFIX}/riders`, isAuthenticated, require('./routes/riders'));
app.use(`${ROUTE_PREFIX}/vendors`, isAuthenticated, require('./routes/vendors'));
app.use(`${ROUTE_PREFIX}/shuttles`, isAuthenticated, require('./routes/shuttles'));

const db = require('./database/db');
db.on('open', () => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    Rider.findOneOrCreate({
      name: 'admin',
      mail: 'admin@ridden.io',
      roles: ['admin']
    }, (err, rider) => {
      if (err) {
        console.log(err);
      } else {
        const payload = { id: rider._id, roles: rider.roles };
        const jwtToken = jwt.sign({ data: payload }, appConfig.secret, { expiresIn: '24h' });
        console.log(`admin token: ${jwtToken}`);
      }
    });
    console.log(`Ridden backend running on port ${port}`);
  });
});

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

function isAuthenticated(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(400).send({
      error: {
        name: 'NoAuthorizationHeader',
        message: 'Authorization headers not set.'
      }
    });
    return;
  }
  if (!auth.startsWith('Bearer ')) {
    res.status(400).send({
      error: {
        name: 'AuthorizationHeaderInvalid',
        message: 'Authorization headers must start with "Bearer".'
      }
    });
    return;
  }
  const token = auth.slice(7);
  jwt.verify(token, appConfig.secret, (err, decoded) => {
    if (err) {
      res.status(401).send({ error: err });
      return;
    } else {
      req.jwtData = decoded.data;
      next();
    }
  });
}
