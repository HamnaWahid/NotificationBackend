const express = require('express');
const config = require('config');
const asyncError = require('../middleware/errorHandling');

const router = express.Router();

const { listTags } = require(`../controllers/mongodb/tagController`);

router.get('/', listTags);
module.exports = router;
