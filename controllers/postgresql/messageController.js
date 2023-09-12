/* eslint-disable no-restricted-syntax */
/* eslint-disable no-const-assign */
const status = require('http-status');
const knex = require('../../startup/knex');

async function listMessages(req, res) {
  const db = knex; // Get the shared database instance
  const { notificationId } = req.query;
  const page = parseInt(req.query.page, 10) || 1; // Current page number, default to 1
  const pageSize = parseInt(req.query.pageSize, 10) || 10; // Number of messages per page, default to 10

  const notification = await db('notifications')
    .where('id', notificationId)
    .first();

  if (!notification || notification.isDeleted) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive notification');
  }

  const queryFilters = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'page' && key !== 'pageSize' && key !== 'notificationId') {
      if (key === 'email') {
        queryFilters[key] = new RegExp(value, 'i'); // Create a regex instance for case-insensitive search
      } else if (key === 'contents') {
        queryFilters[key] = { $regex: value, $options: 'i' };
      } else {
        queryFilters[key] = value;
      }
    }
  }

  let query = db('messages')
    .select('*')
    .where('notificationId', notificationId)
    .orderBy('dateCreated')
    .offset((page - 1) * pageSize)
    .limit(pageSize);

  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'email' || key === 'contents') {
        query = query.whereRaw('?? ~* ?', [key, value.source]);
      } else {
        query = query.where(key, value);
      }
    }
  }

  let totalMessagesQuery = db('messages')
    .count('* as total')
    .where('notificationId', notificationId);
  if (Object.keys(queryFilters).length > 0) {
    for (const [key, value] of Object.entries(queryFilters)) {
      if (key === 'email' || key === 'contents') {
        totalMessagesQuery = totalMessagesQuery.whereRaw('?? ~* ?', [
          key,
          value.source,
        ]);
      } else {
        totalMessagesQuery = totalMessagesQuery.where(key, value);
      }
    }
  }

  const [{ total }] = await totalMessagesQuery;

  const messages = await query;
  const totalPages = Math.ceil(total / pageSize);

  return res.json({
    messages,
    currentPage: page,
    totalPages,
    pageSize,
    totalMessages: total,
  });
}

async function addMessages(req, res) {
  const db = knex; // Get the shared database instance

  const { notificationId } = req.body;
  const notification = await db('notifications')
    .where('id', notificationId)
    .first();

  if (!notification || notification.isDSeleted) {
    return res
      .status(status.BAD_REQUEST)
      .send('Invalid or inactive notification');
  }

  const reqMetadata = req.body.metadata;

  if (!Array.isArray(reqMetadata)) {
    return res.status(status.BAD_REQUEST).send('Invalid metadata format');
  }

  const metadataMap = {};
  reqMetadata.forEach((metadata) => {
    metadataMap[metadata.key] = metadata.value;
  });

  let { templateBody } = notification;
  notification.metadata.forEach((placeholder) => {
    const { key } = placeholder;
    const value = metadataMap[key] || ''; // Use an empty string if value not provided
    templateBody = templateBody.replace(`{${key}}`, value);
  });

  const newMessage = {
    email: req.body.email,
    contents: templateBody,
    notificationId,
    createdBy: 'hamna', // Replace with actual username or user ID
  };

  // Insert the message into the database
  const [savedMessage] = await db('messages').insert(newMessage).returning('*');

  return res.send(savedMessage);
}

module.exports = {
  addMessages,
  listMessages,
};
