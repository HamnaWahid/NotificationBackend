/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const winston = require('winston/lib/winston/config');
const status = require('http-status');
const { Event } = require('../../models/events');
const { Notification } = require('../../models/notification');
const { extractPlaceholders } = require('../../src/extraction');
const { Tag } = require('../../models/tags');

async function listNotification(req, res) {
  const { eventId, isDeleted, notificationId } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const sortBy = req.query.sortBy || 'notificationName'; // Default to sorting by notificationName
  const sortOrder = req.query.sortOrder || 'asc'; // Default to ascending order

  const event = await Event.findById(eventId);

  if (!event || event.isDeleted) {
    return res.status(status.BAD_REQUEST).send('Invalid or deleted event');
  }

  const query = { eventId };

  if (req.query.notificationId) {
    // If notificationId is provided, retrieve only that notification
    query._id = notificationId;
  } else {
    // If notificationId is not provided, retrieve notifications based on other parameters
    query.isDeleted = isDeleted === 'true'; // Convert string to boolean
  }

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
    notificationName: req.body.notificationName.trim(),
    isDeleted: false, // Using the applicationId from the current event
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
    notificationName: req.body.notificationName.trim(),
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

  const { notificationName } = req.body;

  const existingNotification = await Notification.findOne({
    notificationName: notification.notificationName.trim(),
    // eventId,
  });

  if (
    existingNotification
    // existingNotification._id.toString() !== notification._id.toString()
  ) {
    return res
      .status(status.CONFLICT)
      .send('Notification name already exists for this event');
  }
  let existingMetadata = [];
  if (notification.metadata && typeof notification.metadata === 'string') {
    existingMetadata = notification.metadata.split(',');
  }

  const stringTemplateBody = req.body.templateBody;
  const newPlaceholders = extractPlaceholders(stringTemplateBody);

  const existingPlaceholdersPromises = existingMetadata.map(
    async (placeholder) => Tag.findOne({ tags: placeholder.trim() }),
  );

  const existingPlaceholders = await Promise.all(existingPlaceholdersPromises);

  const uniqueNewPlaceholders = newPlaceholders.filter(
    (placeholder) =>
      !existingPlaceholders.some(
        (existingPlaceholder) =>
          existingPlaceholder.tags === placeholder.trim(),
      ),
  );

  const savePlaceholderPromises = uniqueNewPlaceholders.map(
    async (placeholder) => {
      // Check if the placeholder already exists in the Tag table
      const existingTag = await Tag.findOne({ tags: placeholder.trim() });

      if (existingTag) {
        // If it exists, return the existing tag
        return existingTag;
      }
      // If it doesn't exist, create and save a new tag
      const newTag = new Tag({ tags: placeholder.trim() });
      return newTag.save();
    },
  );

  const savedPlaceholders = await Promise.all(savePlaceholderPromises);
  const savedPlaceholderTags = savedPlaceholders.map((tag) => tag.tags);

  // Update metadata based on changes in placeholders
  const updatedMetadata = existingMetadata
    .map((placeholder) => {
      if (newPlaceholders.includes(placeholder.trim())) {
        return placeholder.trim();
      }
      return null; // Placeholder no longer exists, will be removed
    })
    .concat(savedPlaceholderTags);

  const filteredMetadata = updatedMetadata.filter(
    (placeholder) => placeholder !== null,
  );
  const metadata = filteredMetadata.join(',');

  const updatedNotification = await Notification.findByIdAndUpdate(
    req.params.notification_id,
    {
      notificationName: req.body.notificationName.trim(),
      notificationDescription: req.body.notificationDescription,
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

async function deactivateNotification(req, res) {
  const notification = await Event.findById(req.params.notification_id);
  if (!notification) {
    return res.status(status.BAD_REQUEST).send('Event does not exist');
  }
  notification.isActive = !notification.isActive;
  notification.dateUpdated = Date.now();
  await notification.save();

  return res.send(notification);
}

module.exports = {
  addNotification,
  deactivateNotification,
  updateNotification,
  deleteNotification,
  listNotification,
};
