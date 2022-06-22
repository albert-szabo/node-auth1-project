// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!

const express = require('express');

const bcrypt = require('bcryptjs');

const router = express.Router();

const Users = require('../users/users-model');

const { checkUsernameFree, checkUsernameExists, checkPasswordLength } = require('./auth-middleware');

/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
*/

router.post('/register', checkUsernameFree, checkPasswordLength, async (request, response, next) => {
  const { username, password } = request.body;
  const hash = bcrypt.hashSync(password, 12);
  const newUser = await Users.add({ username, password: hash });
  response.status(201).json(newUser);
});

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
*/

router.post('/login', checkUsernameExists, (request, response, next) => {
  const { password } = request.body;
  const passwordMatch = bcrypt.compareSync(password, request.user.password);
  if (passwordMatch) {
    request.session.user = request.user;
    response.json({ message: `Welcome ${request.user.username}` });
  } else {
    next({ status: 401, message: 'Invalid credentials' });
  }
});

/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
*/

router.get('/logout', (request, response, next) => {
  if (request.session.user) {
    request.session.destroy(error => {
      if (error) {
        next(error);
      } else {
        response.json({ message: 'logged out' });
      }
    })
  } else {
    response.json({ message: 'no session' });
  }
});

// Don't forget to add the router to the `exports` object so it can be required in other modules

module.exports = router;