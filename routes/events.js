/* eslint-disable import/no-dynamic-require */
const express = require('express');
const config = require('config');

const router = express.Router();
const dbName = config.get('db');

const {
  validateEvents,
  validateUpdatingEvents,
  validateDeleteEvent,
  // validateGetEvent,
} = require('../middleware/validation');

const {
  addEvent,
  updateEvent,
  listEvent,
  deleteEvent,
} = require(`../controllers/${dbName}/eventsController`);

router.get('/', listEvent);

router.post('/', validateEvents, addEvent);

router.put('/:event_id/update', validateUpdatingEvents, updateEvent);

router.patch('/:event_id/delete', validateDeleteEvent, deleteEvent);

module.exports = router;
