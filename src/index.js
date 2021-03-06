const express = require('express');
const cors = require('cors');
const compression = require('compression'); 
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const auth = require('./config/auth');
const appConfig = require('./config/app');
const logger = require('./logger');

const app = express();
app.options('*', cors())
app.use(cors());

auth(passport);
app.use(passport.initialize());

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
const morganOpts = process.env.NODE_ENV === 'production'
  ? { skip: function (req, res) { return res.statusCode < 400 } }
  : {};
app.use(morgan(morganFormat, morganOpts));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

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
app.use(errorHandler);

const db = require('./database/db');
db.on('open', () => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    logger.log('info', `Ridden backend running on port ${port}`);
  });
});

function errorHandler(err, req, res, next) {
  logger.log('error', 'Unhandled error occurred', { error: err, request: req });
  if (req.xhr) {
    res.status(500).send({ name: 'UnknownError', message: 'Unknown error occurred.' });
  } else {
    res.status(500);
    res.render('error', { error: err });
  }
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
