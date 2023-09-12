const express = require('express');
const winston = require('winston');
const config = require('config');
require('express-async-errors');
const cors = require('cors');
const errorHandling = require('./middleware/errorHandling');

const app = express();
app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
);
require('./startup/db')();
require('./startup/logging');
require('./startup/routes')(app);

app.use(errorHandling);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  winston.debug(`Listening on port ${port}...`),
);

module.exports = server;
