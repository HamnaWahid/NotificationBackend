const uuid = require('uuid');
const winston = require('winston');
// const logger = require('../startup/logging');

function traceIdMiddleware(req, res, next) {
  const traceId = uuid.v4(); // Generate a UUID for trace ID

  if (!req.headers.traceid) {
    req.headers.traceid = traceId; // Store trace ID in request headers
  }
  winston.info(`${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`, {
    traceid: traceId,
  });
  next();
}

module.exports = traceIdMiddleware;
