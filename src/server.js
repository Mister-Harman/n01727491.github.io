const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const attachUser = require('./middleware/attachUser');

dotenv.config();
connectDB();

const app = express();

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
  }),
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
  };
  next();
});

app.use(attachUser);

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const watchlistRoutes = require('./routes/watchlist');

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/movies', movieRoutes);
app.use('/', watchlistRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 Movies app running at http://localhost:${PORT}`);
});
