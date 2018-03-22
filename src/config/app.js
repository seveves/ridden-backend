module.exports = {
  mongodb: process.env.MONGODB_URI || 'mongodb://localhost/ridden-backend',
  clientId: process.env.GOOGLE_CLI_ID || 'supercoolcatfish',
  clientKey: process.env.GOOGLE_CLI_KEY || 'supercoolcatfish',
  clientCallback: process.env.GOGGLE_CB || 'http://localhost:3000/auth/google/callback',
  secret: process.env.JWT_KEY || 'supercoolcatfish',
  frontend: process.env.FRONTEND || 'http://localhost:8080'
};
