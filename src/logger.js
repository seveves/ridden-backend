const winston = require('winston');
require('winston-papertrail').Papertrail;

const logger = new winston.Logger();

if (process.env.NODE_ENV !== 'production') {
  logger.add(winston.transports.Console, { level: 'debug' });
} else {
  logger.add(winston.transports.Papertrail, {
    host: process.env.PT_URL,
    port: process.env.PT_PORT,
    handleExceptions: true,
    hostname: 'ridden-backend.now.sh'
  });
}

module.exports = logger;
