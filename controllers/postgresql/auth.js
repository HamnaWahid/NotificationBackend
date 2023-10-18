const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const knex = require('../../startup/knex');

async function registerUser(req, res) {
  const db = knex; // Get the shared database instance
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db('users')
    .insert({
      email,
      password: hashedPassword,
    })
    .then(() => {
      res.status(201).json({ message: 'User registered successfully' });
    })
    .catch((error) => {
      res
        .status(500)
        .send(`An error occurred while registering the user${error}`);
    });
}

function loginUser(req, res) {
  const { email, password } = req.body;
  const db = knex; // Get the shared database instance

  // Assuming you have a 'users' table in your PostgreSQL database
  db('users')
    .where({ email })
    .first()
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return bcrypt.compare(password, user.password).then((isPasswordValid) => {
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id },
          config.get('jwtPrivateKey'),
        );
        return res.json({ token });
      });
    })
    .catch((error) => {
      res.status(500).send(`An error occurred while logging in${error}`);
    });
}

module.exports = { loginUser, registerUser };
