/* eslint-disable no-restricted-syntax */
const winston = require('winston/lib/winston/config');
const status = require('http-status');
const { Notification } = require('../../models/notification');
const { Message, validate } = require('../../models/message');

async function listMessages(req, res) {
  const { notificationId } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;

  // Check notification validity using Mongoose
  const notification = await Notification.findById(notificationId);

  if (!notification || notification.isDeleted) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive notification');
  }

  // Query Filters for MongoDB
  const queryFilters = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'page' && key !== 'pageSize' && key !== 'notificationId') {
      if (key === 'email' || key === 'contents') {
        queryFilters[key] = { $regex: value, $options: 'i' };
      } else {
        queryFilters[key] = value;
      }
    }
  }

  // MongoDB Query
  const totalMessages = await Message.countDocuments({
    notificationId,
    ...queryFilters,
  });

  const messages = await Message.find({
    notificationId,
    ...queryFilters,
  })
    .sort({ dateCreated: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  return res.json({
    messages,
    currentPage: page,
    totalPages: Math.ceil(totalMessages / pageSize),
    pageSize,
    totalMessages,
  });
}

async function addMessages(req, res) {
  const { notificationId } = req.body;

  // Check if notificationId is valid (assuming findById returns null if not found)
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.isDeleted) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive notification');
  }

  // Assuming req.body.metadata is the JSON object containing metadata in the request body
  const reqMetadata = req.body.metadata;

  if (Object.keys(reqMetadata).length !== notification.metadata.length) {
    return res.status(status.BAD_REQUEST).send('Metadata count mismatch');
  }
  let { templateBody } = notification;
  Object.keys(reqMetadata).forEach((key) => {
    const value = reqMetadata[key];
    templateBody = templateBody.replace(`{${key}}`, value);
  });
  const message = new Message({
    email: req.body.email,
    contents: templateBody,
    notificationId,
    createdBy: 'hamna', // Replace with actual username or user ID
  });

  // Save the event to the database
  const savedMessage = await message.save();

  return res.send(savedMessage);
}

module.exports = {
  addMessages,
  listMessages,
};
