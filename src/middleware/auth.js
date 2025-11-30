const Movie = require('../models/Movie');

function ensureAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'You must be logged in to do that.');
    return res.redirect('/login');
  }
  next();
}

function ensureGuest(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/movies');
  }
  next();
}

async function loadMovie(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) {
      return res.status(404).render('404', { title: 'Movie Not Found' });
    }
    res.locals.movie = movie;
    next();
  } catch (err) {
    next(err);
  }
}

function ensureOwner(req, res, next) {
  const movie = res.locals.movie;
  if (!movie || !req.user || movie.owner.toString() !== req.user._id.toString()) {
    req.flash('error', 'You are not allowed to modify this movie.');
    return res.redirect('/movies');
  }
  next();
}

module.exports = {
  ensureAuth,
  ensureGuest,
  loadMovie,
  ensureOwner,
};
