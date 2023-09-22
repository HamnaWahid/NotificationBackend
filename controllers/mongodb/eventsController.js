/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const winston = require('winston/lib/winston/config');
const status = require('http-status');
const { Application } = require('../../models/application');
const { Event, validate } = require('../../models/events');

async function listEvent(req, res) {
  const { applicationId } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const sortBy = req.query.sortBy || 'eventName'; // Default to sorting by dateCreated
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  // Check application validity using Mongoose
  const application = await Application.findById(applicationId);

  if (!application || application.isDeleted) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive application');
  }

  // Query Filters for MongoDB
  const queryFilters = {};
  queryFilters.isDeleted = false; // Add this condition to your existing queryFilters

  for (const [key, value] of Object.entries(req.query)) {
    if (
      key !== 'page' &&
      key !== 'pageSize' &&
      key !== 'applicationId' &&
      key !== 'sortBy' &&
      key !== 'sortOrder'
    ) {
      if (key === 'isDeleted') {
        queryFilters[key] = value === 'false';
      } else if (key === 'eventName' || key === 'eventDescription') {
        queryFilters[key] = { $regex: value, $options: 'i' };
      } else {
        queryFilters[key] = value;
      }
    }
  }

  // MongoDB Query
  const totalEvents = await Event.countDocuments({
    applicationId,
    ...queryFilters,
  });

  const sortOption = {};
  sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1; // Create sort option dynamically

  const events = await Event.find({
    applicationId,
    ...queryFilters,
  })
    .sort(sortOption) // Apply sorting based on sortBy and sortOrder
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  return res.json({
    events,
    currentPage: page,
    totalPages: Math.ceil(totalEvents / pageSize),
    pageSize,
    totalEvents,
  });
}

async function addEvent(req, res) {
  const { applicationId } = req.body;

  // Check if applicationId is valid (assuming findById returns null if not found)
  const application = await Application.findById(applicationId);
  if (!application || application.isDeleted || !application.isActive) {
    return res.status(status.NOT_FOUND).send('Invalid or inactive application');
  }

  // Check if an event with the same name exists for the given application
  const existingEvent = await Event.findOne({
    eventName: req.body.eventName.trim(),
    applicationId,
    isDeleted: false,
  });
  if (existingEvent && !existingEvent.isDeleted) {
    return res
      .status(status.CONFLICT)
      .send('An event with the same name already exists');
  }
  // if (existingEvent && existingEvent.isDeleted) {
  //   // Create and save the new application
  //   const event = new Event({
  //     eventName: req.body.eventName,
  //     eventDescription: req.body.eventDescription,
  //     createdBy: 'hamna', // Replace with actual username retrieval
  //   });

  //   await application.save();
  //   return res.status(status.OK).send(application);
  // }
  const event = new Event({
    eventName: req.body.eventName.trim(),
    eventDescription: req.body.eventDescription,
    applicationId,
    createdBy: 'hamna', // Replace with actual username or user ID
  });

  // Save the event to the database
  const savedEvent = await event.save();

  return res.send(savedEvent);
}

async function updateEvent(req, res) {
  const { event_id } = req.params;
  const { eventName, eventDescription } = req.body;

  const event = await Event.findById(event_id);
  if (!event) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }
  const appId = event.applicationId;

  // Check if the updated event name already exists
  const existingEvent = await Event.findOne({
    eventName: eventName.trim(),
    applicationId: event.applicationId,
    isDeleted: false, // Using the applicationId from the current event
  });

  if (
    existingEvent &&
    !existingEvent.isDeleted &&
    existingEvent._id.toString() !== event._id.toString()
  ) {
    return res.status(status.CONFLICT).send('Event name already exists');
  }

  const updatedEventData = {
    eventName: eventName.trim(),
    eventDescription,
    dateUpdated: Date.now(),
  };

  const updatedEvent = await Event.findByIdAndUpdate(
    event_id,
    updatedEventData,
    { new: true },
  );

  if (!updatedEvent) {
    return res.status(status.CONFLICT).send('Event not found');
  }

  return res.send(updatedEvent);
}

async function deleteEvent(req, res) {
  const event = await Event.findById(req.params.event_id);
  if (!event) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }

  const deletedEvent = await Event.findByIdAndUpdate(
    req.params.event_id,
    {
      isDeleted: true,
      dateUpdated: Date.now(),
    },
    { new: true },
  );
  return res.send(deletedEvent);
}

async function deactivateEvent(req, res) {
  const event = await Event.findById(req.params.event_id);
  if (!event) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }
  event.isActive = !event.isActive;
  event.dateUpdated = Date.now();
  await event.save();

  return res.send(event);
}

module.exports = {
  addEvent,
  deactivateEvent,
  updateEvent,
  deleteEvent,
  listEvent,
};
