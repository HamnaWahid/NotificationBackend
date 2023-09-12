/* eslint-disable import/no-dynamic-require */
const config = require('config');
const express = require('express');

const dbName = config.get('db');
const router = express.Router();

const {
  validateMessages,
  validateGetMessages,
} = require('../middleware/validation');

const {
  addMessages,
  listMessages,
} = require(`../controllers/${dbName}/messageController`);

router.get('/', validateGetMessages, listMessages);

router.post('/', validateMessages, addMessages);

module.exports = router;
