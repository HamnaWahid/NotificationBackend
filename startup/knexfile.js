/* eslint-disable prettier/prettier */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../node_modules/config');

const postgresqlConfig = config.get('postgresql');
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'postgresql',

    connection: {
      host: postgresqlConfig.host,
      user: postgresqlConfig.username,
      password: postgresqlConfig.password,
      database: postgresqlConfig.database,
    },

    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: `${__dirname}/migrations`,
      tableName: 'knex_migrations',
    },
  },
};
