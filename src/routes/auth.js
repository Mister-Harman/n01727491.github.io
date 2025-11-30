const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { ensureGuest } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /register
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    values: {},
    errors: [],
  });
});

// POST /register
router.post(
  '/register',
  ensureGuest,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
    body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords must match.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { name, email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        values: { name, email },
        errors: errors.array(),
      });
    }

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).render('auth/register', {
          title: 'Register',
          values: { name, email },
          errors: [{ msg: 'Email is already registered.' }],
        });
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        passwordHash: hash,
      });

      req.session.userId = user._id;
      req.flash('success', 'Welcome! Your account has been created.');
      res.redirect('/movies');
    } catch (err) {
      next(err);
    }
  }
);

// GET /login
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    values: {},
    errors: [],
  });
});

// POST /login
router.post('/login', ensureGuest, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        values: { email },
        errors: [{ msg: 'Invalid email or password.' }],
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        values: { email },
        errors: [{ msg: 'Invalid email or password.' }],
      });
    }

    req.session.userId = user._id;
    req.flash('success', 'Logged in successfully.');
    res.redirect('/movies');
  } catch (err) {
    next(err);
  }
});

// POST /logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
