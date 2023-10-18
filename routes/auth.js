/* eslint-disable import/no-dynamic-require */
// routes/auth.js
const config = require('config');
const express = require('express');

const dbName = config.get('db');

const { registerUser, loginUser } = require(`../controllers/${dbName}/auth`);
const { validateUser } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateUser, registerUser);
router.post('/', validateUser, loginUser);

module.exports = router;
