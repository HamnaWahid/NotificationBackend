const winston = require('winston');

module.exports = function (err, req, res, next) {
  // Log the error
  winston.error(`[${req.headers.traceid}] ${err}`);

  // Respond with an error message
  res.status(500).json({ error: 'Internal server error' });
};
