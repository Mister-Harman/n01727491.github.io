const express = require('express');
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');
const Movie = require('../models/Movie');

const router = express.Router();

// POST /movies/:id/watchlist (toggle)
router.post('/movies/:id/watchlist', ensureAuth, async (req, res, next) => {
  try {
    const movieId = req.params.id;
    const user = await User.findById(req.session.userId);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }

    const idx = user.watchlist.findIndex((id) => id.toString() === movieId);
    if (idx === -1) {
      user.watchlist.push(movieId);
      req.flash('success', 'Added to your watchlist.');
    } else {
      user.watchlist.splice(idx, 1);
      req.flash('success', 'Removed from your watchlist.');
    }

    await user.save();
    const redirectTo = req.get('Referrer') || '/movies';
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
});

// GET /watchlist
router.get('/watchlist', ensureAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId)
      .populate('watchlist')
      .lean();

    const movies = user.watchlist || [];

    res.render('index', {
      title: 'My Watchlist',
      movies: movies.map((m) => ({ ...m, isStarred: true })),
      page: 1,
      totalPages: 1,
      search: '',
      genre: '',
      sort: 'newest',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
