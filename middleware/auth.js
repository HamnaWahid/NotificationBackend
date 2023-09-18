/* eslint-disable consistent-return */
// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('config');

const authenticateToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token)
    return res.sendStatus(401).send('Access denied. No token provided.');

  jwt.verify(token, config.get('jwtPrivateKey'), (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
