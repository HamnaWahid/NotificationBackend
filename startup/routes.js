const express = require('express');
const application = require('../routes/applications');
const tag = require('../routes/tag');
const events = require('../routes/events');
const message = require('../routes/message');
const notifications = require('../routes/notification');

module.exports = function (app) {
  app.use(express.json());

  app.use(require('../middleware/traceIdMiddleware'));

  app.use('/api/applications', application);
  app.use('/api/tags', tag);
  app.use('/api/events', events);
  app.use('/api/message', message);
  app.use('/api/notifications', notifications);
};
