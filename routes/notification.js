/* eslint-disable import/no-dynamic-require */
const config = require('config');
const express = require('express');

const dbName = config.get('db');
const router = express.Router();

const {
  validateNotification,
  validateUpdatingNotification,
  validateDeleteNotification,
  // validateGetNotifications,
} = require('../middleware/validation');

const {
  addNotification,
  updateNotification,
  deleteNotification,
  listNotification,
  deactivateNotification,
} = require(`../controllers/${dbName}/notificationController`);

router.get('/', listNotification);

router.post('/', validateNotification, addNotification);

router.put(
  '/:notification_id/update',
  validateUpdatingNotification,
  updateNotification,
);

router.patch(
  '/:notification_id/delete',
  validateDeleteNotification,
  deleteNotification,
);
router.patch('/:notification_id/deactivate', deactivateNotification);

module.exports = router;
