/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-const-assign */
const status = require('http-status');
const knex = require('../../startup/knex');

async function listEvent(req, res) {
  const db = knex; // Get the shared database instance
  const { applicationId } = req.query;
  const page = parseInt(req.query.page, 10) || 1; // Current page number, default to 1
  const pageSize = parseInt(req.query.pageSize, 10) || 10; // Number of events per page, default to 10
  const sortBy = req.query.sortBy || 'dateCreated'; // Default to sorting by dateCreated
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  const application = await db('applications')
    .where('id', applicationId)
    .first();

  if (!application || application.isDeleted || !application.isActive) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive application');
  }

  const queryFilters = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (
      key !== 'page' &&
      key !== 'pageSize' &&
      key !== 'applicationId' &&
      key !== 'sortBy' &&
      key !== 'sortOrder'
    ) {
      if (key === 'isDeleted') {
        queryFilters[key] = value === 'true';
      } else if (key === 'eventName' || key === 'eventDescription') {
        queryFilters[key] = `%${value}%`;
      } else {
        queryFilters[key] = value;
      }
    }
  }

  let query = db('events')
    .select('*')
    .where('applicationId', applicationId)
    .orderBy(sortBy, sortOrder) // Apply sorting based on sortBy and sortOrder
    .offset((page - 1) * pageSize)
    .limit(pageSize);

  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'isDeleted') {
        query = query.where(key, value);
      } else {
        query = query.where(key, 'ilike', value);
      }
    }
  }

  let totalEventsQuery = db('events')
    .count('* as total')
    .where('applicationId', applicationId);
  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'isDeleted') {
        totalEventsQuery = totalEventsQuery.where(key, value);
      } else {
        totalEventsQuery = totalEventsQuery.where(key, 'ilike', value);
      }
    }
  }

  const [{ total }] = await totalEventsQuery;

  const events = await query;
  const totalPages = Math.ceil(total / pageSize);

  return res.json({
    events,
    currentPage: page,
    totalPages,
    pageSize,
    totalEvents: total,
  });
}

async function addEvent(req, res) {
  const db = knex; // Get the shared database instance

  const { applicationId } = req.body;

  // Check if applicationId is valid
  const application = await db('applications')
    .where('id', applicationId)
    .where('isDeleted', false)
    .where('isActive', true)
    .first();

  if (!application) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive application');
  }

  const { eventName, eventDescription } = req.body;

  // Check if an event with the same name already exists for this application
  const existingEvent = await db('events')
    .where('eventName', eventName)
    .where('applicationId', applicationId)
    .first();

  if (existingEvent) {
    return res
      .status(status.CONFLICT)
      .send('An event with the same name already exists for this application.');
  }

  const newEvent = {
    eventName,
    eventDescription,
    applicationId,
    createdBy: 'hamna', // Replace with actual username or user ID
  };

  // Insert the new event into the database
  const savedEvent = await db('events').insert(newEvent).returning('*');

  return res.send(savedEvent[0]);
}

async function updateEvent(req, res) {
  const db = knex; // Get the shared database instance

  const { eventName, eventDescription } = req.body;

  // Check if an event with the same name already exists for this application

  const event = await db('events').where('id', req.params.event_id).first();
  const existingEvent = await db('events')
    .where('eventName', eventName)
    .where('isDeleted', false)
    .where('applicationId', event.applicationId)
    .whereNot('id', req.params.event_id)
    .first();

  if (existingEvent) {
    return res
      .status(status.CONFLICT)
      .send('An event with the same name already exists for this application.');
  }
  if (!event) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }

  const updatedEvent = await db('events')
    .where('id', req.params.event_id)
    .update({
      eventName,
      eventDescription,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(updatedEvent[0]);
}

async function deleteEvent(req, res) {
  const db = knex; // Get the shared database instance

  const event = await db('events').where('id', req.params.event_id).first();

  if (!event) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }
  const deletedEvent = await db('events')
    .where('id', req.params.event_id)
    .update({
      isDeleted: true,
      isActive: false,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(deletedEvent[0]);
}

async function deactivateEvent(req, res) {
  const db = knex; // Get the shared database instance

  const eventId = req.params.event_id;

  // Check if event exists
  const event = await db('events').where('id', eventId).first();

  if (!event) {
    return res.status(400).send('Event does not exist');
  }

  const updatedEvent = await db('events')
    .where('id', eventId)
    .update({
      isActive: !event.isActive,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(updatedEvent[0]);
}

module.exports = {
  deactivateEvent,
  addEvent,
  listEvent,
  updateEvent,
  deleteEvent,
};
