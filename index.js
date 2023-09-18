const express = require('express');
const winston = require('winston');
const config = require('config');
require('express-async-errors');
const cors = require('cors');
const errorHandling = require('./middleware/errorHandling');

if (!config.get('jwtPrivateKey')) {
  throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
}

const app = express();
app.use(cors());
require('./startup/db')();
require('./startup/logging');
require('./startup/routes')(app);

app.use(errorHandling);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.debug(`Listening on port ${port}...`),
);

module.exports = server;
