/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const winston = require('winston/lib/winston/config');
const { not } = require('joi');
const status = require('http-status');
const { Application } = require('../../models/application');
const { Event } = require('../../models/events');
const { Notification } = require('../../models/notification');
const { extractPlaceholders } = require('../../src/extraction');

async function listNotification(req, res) {
  const { eventId, isDeleted } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;

  const event = await Event.findById(eventId);

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const query = { eventId };

  if (isDeleted) {
    query.isDeleted = isDeleted === 'true'; // Convert string to boolean
  } else {
    query.isDeleted = false; // Only retrieve non-deleted notifications by default
  }

  const totalNotifications = await Notification.countDocuments(query);

  const totalPages = Math.ceil(totalNotifications / pageSize);

  const notifications = await Notification.find(query)
    .sort('dateCreated')
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  return res.json({
    notifications,
    currentPage: page,
    totalPages,
    pageSize,
    totalNotifications,
  });
}

async function addNotification(req, res) {
  const { eventId } = req.body;

  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  // Check if a notification with the same name already exists
  const existingNotification = await Notification.findOne({
    notificationName: req.body.notificationName,
    eventId,
  });

  if (existingNotification) {
    return res.status(status.CONFLICT).send('Notification name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);
  const metadata = placeholders;
  const notification = new Notification({
    notificationName: req.body.notificationName,
    notificationDescription: req.body.notificationDescription,
    eventId,
    templateBody: req.body.templateBody,
    templateSubject: req.body.templateSubject,
    metadata,
    createdBy: 'hamna', // Replace with actual username or user ID
  });

  // Save the notification to the database
  const savedNotification = await notification.save();
  return res.send(savedNotification);
}

async function updateNotification(req, res) {
  const { eventId } = req.query;

  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const notification = await Notification.findById(req.params.notification_id);
  if (!notification) {
    return res.status(status.BAD_REQUEST).send('Notification does not exist');
  }

  if (notification.eventId.toString() !== event._id.toString()) {
    return res
      .status(status.NOT_FOUND)
      .send('Notification not associated with this event id');
  }

  // Check if a notification with the same name already exists
  const existingNotification = await Notification.findOne({
    notificationName: req.body.notificationName,
    eventId,
  });

  if (
    existingNotification &&
    existingNotification._id.toString() !== req.params.notification_id
  ) {
    return res.status(status.CONFLICT).send('Notification name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);
  const metadata = placeholders;
  const updatedNotification = await Notification.findByIdAndUpdate(
    req.params.notification_id,
    {
      notificationName: req.body.notificationName,
      notificationDescription: req.body.notificationDescription,
      eventId,
      templateBody: req.body.templateBody,
      templateSubject: req.body.templateSubject,
      metadata,
      dateUpdated: Date.now(),
    },
    { new: true },
  );
  return res.send(updatedNotification);
}

async function deleteNotification(req, res) {
  // Check if eventId is valid
  const { eventId } = req.query;
  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  // validating notifications
  const notification = await Notification.findById(req.params.notification_id);

  if (!notification) {
    return res.status(status.BAD_REQUEST).send('notification does not exist');
  }

  // check if notification has the same event
  if (notification.eventId.toString() !== event._id.toString()) {
    return res
      .status(status.NOT_FOUND)
      .send('Event not associated with this application id');
  }

  const deletedNotification = await Notification.findByIdAndUpdate(
    req.params.notification_id,
    {
      isDeleted: true,
      dateUpdated: Date.now(),
    },
    { new: true },
  );
  return res.send(deletedNotification);
}

module.exports = {
  addNotification,
  updateNotification,
  deleteNotification,
  listNotification,
};
