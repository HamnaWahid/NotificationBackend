/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const winston = require('winston/lib/winston/config');
const status = require('http-status');
const { Event } = require('../../models/events');
const { Notification } = require('../../models/notification');
const { extractPlaceholders } = require('../../src/extraction');
const { Tag } = require('../../models/tags');

async function listNotification(req, res) {
  const { eventId, isDeleted } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const sortBy = req.query.sortBy || 'dateCreated'; // Default to sorting by dateCreated
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  const event = await Event.findById(eventId);

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const query = { eventId };

  query.isDeleted = false; // Convert string to boolean

  const totalNotifications = await Notification.countDocuments(query);

  const totalPages = Math.ceil(totalNotifications / pageSize);

  const sortOption = {};
  sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1; // Create sort option dynamically

  const notifications = await Notification.find(query)
    .sort(sortOption) // Apply sorting based on sortBy and sortOrder
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

  if (existingNotification && !existingNotification.isDeleted) {
    return res.status(status.CONFLICT).send('Notification name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);

  const existingPlaceholdersPromises = placeholders.map(async (placeholder) =>
    Tag.findOne({ tags: placeholder.trim() }),
  );

  const existingPlaceholders = await Promise.all(existingPlaceholdersPromises);

  const uniquePlaceholders = placeholders.filter((placeholder, index) => {
    const existingPlaceholder = existingPlaceholders[index];
    return !existingPlaceholder;
  });

  const savePlaceholderPromises = uniquePlaceholders.map(
    async (placeholder) => {
      const newTag = new Tag({ tags: placeholder.trim() });
      return newTag.save();
    },
  );

  await Promise.all(savePlaceholderPromises);

  const metadata = uniquePlaceholders.join(',');

  const notification = new Notification({
    notificationName: req.body.notificationName,
    notificationDescription: req.body.notificationDescription,
    eventId,
    templateBody: req.body.templateBody,
    templateSubject: req.body.templateSubject,
    metadata,
    createdBy: 'hamna', // Replace with actual username or user ID
  });

  const savedNotification = await notification.save();
  return res.send(savedNotification);
}

async function updateNotification(req, res) {
  const notification = await Notification.findById(req.params.notification_id);
  if (!notification) {
    return res.status(status.BAD_REQUEST).send('Notification does not exist');
  }
  const { eventId } = notification;

  // Check if a notification with the same name already exists
  const existingNotification = await Notification.findOne({
    notificationName: req.body.notificationName,
    eventId,
  });

  if (
    existingNotification &&
    !existingNotification.isDeleted &&
    existingNotification._id.toString() !== req.params.notification_id
  ) {
    return res.status(status.CONFLICT).send('Notification name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);

  const existingPlaceholdersPromises = placeholders.map(async (placeholder) =>
    Tag.findOne({ tags: placeholder.trim() }),
  );

  const existingPlaceholders = await Promise.all(existingPlaceholdersPromises);

  const uniquePlaceholders = placeholders.filter((placeholder, index) => {
    const existingPlaceholder = existingPlaceholders[index];
    return !existingPlaceholder;
  });

  const savePlaceholderPromises = uniquePlaceholders.map(
    async (placeholder) => {
      const newTag = new Tag({ tags: placeholder.trim() });
      return newTag.save();
    },
  );

  await Promise.all(savePlaceholderPromises);

  const metadata = uniquePlaceholders.join(',');

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

  // validating notifications
  const notification = await Notification.findById(req.params.notification_id);

  if (!notification) {
    return res.status(status.BAD_REQUEST).send('notification does not exist');
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
// async function deactivateNotification(req, res) {}

module.exports = {
  addNotification,
  // deactivateNotification,
  updateNotification,
  deleteNotification,
  listNotification,
};
