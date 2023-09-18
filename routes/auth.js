// routes/auth.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/mongodb/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/', loginUser);

module.exports = router;
