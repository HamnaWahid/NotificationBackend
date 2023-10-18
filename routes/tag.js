const express = require('express');
const config = require('config');
const asyncError = require('../middleware/errorHandling');

const router = express.Router();
const dbName = config.get('db');
// eslint-disable-next-line import/no-dynamic-require
const { listTags } = require(`../controllers/${dbName}/tagController`);

router.get('/', listTags);
module.exports = router;
