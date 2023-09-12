const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

let db;
module.exports = function () {
  const dbType = config.get('db');

  if (dbType === 'postgresql') {
    db = require('./knex');

    db.raw('SELECT 1')
      .then(() => winston.info('Connected to PostgreSQL...'))
      .catch((err) => winston.error('Error connecting to PostgreSQL:', err));
  } else if (dbType === 'mongodb') {
    const dbUrl = config.get('mongodb');
    mongoose
      .connect(dbUrl)
      .then(() => winston.info(`Connected to ${dbUrl}...`));
  }
};

module.exports.getDb = function () {
  return db;
};
