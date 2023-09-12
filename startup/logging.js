const winston = require('winston');

const env = process.env.NODE_ENV;
const level = env === 'production' ? 'error' : 'debug';

// Handle exceptions and log errors
winston.exceptions.handle((err) => {
  winston.error(`Unhandled exception:`, err);
});

winston.configure({
  level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) =>
        `[${info.timestamp}] [${info.level.toUpperCase()}][${
          info.traceid ? ` ${info.traceid}` : '' // Include traceid if available
        }]${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Create a logger instance
const logger = winston.createLogger();

module.exports = logger;
