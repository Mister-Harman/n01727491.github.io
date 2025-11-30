const express = require('express');
const { body, validationResult } = require('express-validator');
const { ensureAuth, loadMovie, ensureOwner } = require('../middleware/auth');
const Movie = require('../models/Movie');

const router = express.Router();

const MOVIES_PER_PAGE = 6;

// GET /movies (list + search + filter + sort + pagination)
router.get('/', async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const search = (req.query.q || '').trim();
  const genre = (req.query.genre || '').trim();
  const sort = (req.query.sort || 'newest').trim();

  const filter = {};
  if (search) {
    filter.title = { $regex: search, $options: 'i' }; 
  }
  if (genre) {
    filter.genres = { $regex: genre, $options: 'i' };
  }

  const sortOptionsMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating_desc: { rating: -1, createdAt: -1 },
    rating_asc: { rating: 1, createdAt: -1 },
    title_asc: { title: 1 },
  };

  const sortOption = sortOptionsMap[sort] || sortOptionsMap.newest;

  try {
    const totalCount = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .sort(sortOption)
      .skip((page - 1) * MOVIES_PER_PAGE)
      .limit(MOVIES_PER_PAGE)
      .lean();

    const totalPages = Math.max(Math.ceil(totalCount / MOVIES_PER_PAGE), 1);
    const userWatchlistIds =
      req.user && req.user.watchlist
        ? req.user.watchlist.map((id) => id.toString())
        : [];

    const moviesWithStar = movies.map((m) => ({
      ...m,
      isStarred: userWatchlistIds.includes(m._id.toString()),
    }));

    res.render('index', {
      title: 'Movies',
      movies: moviesWithStar,
      page,
      totalPages,
      search,
      genre,
      sort,
    });
  } catch (err) {
    next(err);
  }
});

// GET /movies/new
router.get('/new', ensureAuth, (req, res) => {
  res.render('movies/form', {
    title: 'Add Movie',
    movie: {},
    errors: [],
    isEdit: false,
  });
});

// POST /movies
router.post(
  '/',
  ensureAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Title must be at least 2 characters.'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters.'),
    body('year').isInt({ min: 1888 }).withMessage('Enter a valid year.'),
    body('rating')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0, max: 10 })
      .withMessage('Rating must be between 0 and 10.'),
    body('genres')
      .trim()
      .notEmpty()
      .withMessage('Enter at least one genre.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { title, description, year, rating, genres } = req.body;

    const genresArray = genres.split(',').map((g) => g.trim()).filter(Boolean);

    if (!errors.isEmpty()) {
      return res.status(400).render('movies/form', {
        title: 'Add Movie',
        movie: { title, description, year, rating, genres },
        errors: errors.array(),
        isEdit: false,
      });
    }

    try {
      await Movie.create({
        title,
        description,
        year,
        rating: rating || undefined,
        genres: genresArray,
        owner: req.session.userId,
      });

      req.flash('success', 'Movie added successfully.');
      res.redirect('/movies');
    } catch (err) {
      next(err);
    }
  }
);

// GET /movies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('owner', 'name')
      .lean();

    if (!movie) {
      return res.status(404).render('404', { title: 'Movie Not Found' });
    }

    const isOwner =
      req.user &&
      movie.owner &&
      movie.owner._id.toString() === req.user._id.toString();

    const isStarred =
      req.user &&
      req.user.watchlist &&
      req.user.watchlist.some(
        (id) => id.toString() === movie._id.toString()
      );

    res.render('movies/show', {
      title: movie.title,
      movie,
      isOwner,
      isStarred,
    });
  } catch (err) {
    next(err);
  }
});

// GET /movies/:id/edit
router.get('/:id/edit', ensureAuth, loadMovie, ensureOwner, (req, res) => {
  const movie = res.locals.movie;
  const genresString = (movie.genres || []).join(', ');
  res.render('movies/form', {
    title: 'Edit Movie',
    movie: { ...movie, genres: genresString },
    errors: [],
    isEdit: true,
  });
});

// PUT /movies/:id
router.put(
  '/:id',
  ensureAuth,
  loadMovie,
  ensureOwner,
  [
    body('title')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Title must be at least 2 characters.'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters.'),
    body('year').isInt({ min: 1888 }).withMessage('Enter a valid year.'),
    body('rating')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0, max: 10 })
      .withMessage('Rating must be between 0 and 10.'),
    body('genres')
      .trim()
      .notEmpty()
      .withMessage('Enter at least one genre.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { title, description, year, rating, genres } = req.body;
    const movie = res.locals.movie;

    const genresArray = genres.split(',').map((g) => g.trim()).filter(Boolean);

    if (!errors.isEmpty()) {
      return res.status(400).render('movies/form', {
        title: 'Edit Movie',
        movie: { ...movie, title, description, year, rating, genres },
        errors: errors.array(),
        isEdit: true,
      });
    }

    try {
      await Movie.findByIdAndUpdate(movie._id, {
        title,
        description,
        year,
        rating: rating || undefined,
        genres: genresArray,
      });

      req.flash('success', 'Movie updated successfully.');
      res.redirect(`/movies/${movie._id}`);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /movies/:id
router.delete('/:id', ensureAuth, loadMovie, ensureOwner, async (req, res, next) => {
  try {
    await Movie.findByIdAndDelete(res.locals.movie._id);
    req.flash('success', 'Movie deleted.');
    res.redirect('/movies');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
