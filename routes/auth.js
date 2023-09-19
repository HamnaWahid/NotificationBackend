// routes/auth.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/mongodb/auth');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateUser, registerUser);
router.post('/', validateUser, loginUser);

module.exports = router;
