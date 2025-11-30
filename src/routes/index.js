const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const User = require('../models/User');

// Home → welcome page
router.get('/', async (req, res, next) => {
  try {
    const latestMovies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    res.render('home', {
      title: 'Welcome',
      isGuest: !req.user,
      user: req.user || null,
      latestMovies,
    });
  } catch (err) {
    next(err);
  }
});

// Profile page (still separate)
router.get('/profile', async (req, res, next) => {
  try {
    // Guest view
    if (!req.user) {
      const latestMovies = await Movie.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

      return res.render('profile', {
        title: 'Profile',
        isGuest: true,
        latestMovies,
      });
    }

    // Logged-in user view
    const [myMovies, userWithWatchlist] = await Promise.all([
      Movie.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      User.findById(req.user._id).populate('watchlist').lean(),
    ]);

    const watchlistMovies =
      (userWithWatchlist && userWithWatchlist.watchlist) || [];

    res.render('profile', {
      title: 'Your Profile',
      isGuest: false,
      user: req.user,
      myMovies,
      watchlistMovies,
      stats: {
        myMoviesCount: myMovies.length,
        watchlistCount: watchlistMovies.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
