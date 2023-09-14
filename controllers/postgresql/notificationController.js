const status = require('http-status');
const { extractPlaceholders } = require('../../src/extraction');
const knex = require('../../startup/knex');

async function listNotification(req, res) {
  const db = knex; // Get the shared database instance
  const { eventId } = req.query;
  const page = parseInt(req.query.page, 10) || 1; // Current page number, default to 1
  const pageSize = parseInt(req.query.pageSize, 10) || 10; // Number of notifications per page, default to 10
  const sortBy = req.query.sortBy || 'notificationName'; // Default to sorting by notificationName
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  const event = await db('events').where('id', eventId).first();

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  // Count total notifications for the given eventId
  const totalNotifications = await db('notifications')
    .count('* as total')
    .where('eventId', eventId)
    .first();

  // Calculate total pages based on pageSize
  const totalPages = Math.ceil(totalNotifications.total / pageSize);

  // Find notifications for the given eventId with pagination and sorting
  const notifications = await db('notifications')
    .select('*')
    .where('eventId', eventId)
    .orderBy(sortBy, sortOrder) // Apply sorting based on sortBy and sortOrder
    .offset((page - 1) * pageSize)
    .limit(pageSize);

  return res.json({
    notifications,
    currentPage: page,
    totalPages,
    pageSize,
    totalNotifications: totalNotifications.total,
  });
}

async function addNotification(req, res) {
  const db = knex; // Get the shared database instance

  const { eventId } = req.body;

  // Check if eventId is valid
  const event = await db('events')
    .where('id', eventId)
    .where('isDeleted', false)
    .first();

  if (!event) {
    return res.status(400).send('Invalid or deleted event');
  }

  // Check if a notification with the same name already exists for the event
  const existingNotification = await db('notifications')
    .where('eventId', eventId)
    .where('notificationName', req.body.notificationName)
    .first();

  if (existingNotification) {
    return res
      .status(status.CONFLICT)
      .send('Notification with the same name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);
  const metadata = placeholders.map((placeholder) => ({
    key: placeholder,
    value: null,
  }));
  const newNotification = {
    notificationName: req.body.notificationName,
    notificationDescription: req.body.notificationDescription,
    eventId,
    templateBody: req.body.templateBody,
    templateSubject: req.body.templateSubject,
    metadata,
    createdBy: 'hamna', // Replace with actual username or user ID
  };
  newNotification.metadata = JSON.stringify(newNotification.metadata);

  // Insert the notification into the database
  const [savedNotification] = await db('notifications')
    .insert(newNotification)
    .returning('*');

  return res.send(savedNotification);
}

async function updateNotification(req, res) {
  const db = knex; // Get the shared database instance

  const { eventId } = req.query;

  const event = await db('events').where('id', eventId).first();

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const notificationId = req.params.notification_id;
  const notification = await db('notifications')
    .where('id', notificationId)
    .first();

  if (!notification || notification.eventId !== event.id) {
    return res
      .status(status.NOT_FOUND)
      .send('Notification not associated with this event id');
  }

  // Check if a notification with the same name already exists for the event
  const existingNotification = await db('notifications')
    .where('eventId', eventId)
    .where('notificationName', req.body.notificationName)
    .whereNot('id', notificationId) // Exclude the current notification from the check
    .first();

  if (existingNotification) {
    return res
      .status(status.CONFLICT)
      .send('Notification with the same name already exists');
  }

  const stringTemplateBody = req.body.templateBody;
  const placeholders = extractPlaceholders(stringTemplateBody);
  let metadata = placeholders.map((placeholder) => ({
    key: placeholder,
    value: null,
  }));
  metadata = JSON.stringify(metadata);
  const updatedNotification = await db('notifications')
    .where('id', notificationId)
    .update({
      notificationName: req.body.notificationName,
      notificationDescription: req.body.notificationDescription,
      eventId,
      templateBody: req.body.templateBody,
      templateSubject: req.body.templateSubject,
      metadata,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(updatedNotification[0]);
}

async function deleteNotification(req, res) {
  const db = knex; // Get the shared database instance

  const { eventId } = req.query;

  const event = await db('events').where('id', eventId).first();

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const notificationId = req.params.notification_id;
  const notification = await db('notifications')
    .where('id', notificationId)
    .first();

  if (!notification) {
    return res.status(status.BAD_REQUEST).send('Notification does not exist');
  }

  if (!notification || notification.eventId !== event.id) {
    return res
      .status(status.NOT_FOUND)
      .send('Notification not associated with this event id');
  }

  const deletedNotification = await db('notifications')
    .where('id', notificationId)
    .update({
      isDeleted: true,
      dateUpdated: new Date(),
    })
    .returning('*');

  return res.send(deletedNotification[0]);
}

module.exports = {
  addNotification,
  updateNotification,
  listNotification,
  deleteNotification,
};
