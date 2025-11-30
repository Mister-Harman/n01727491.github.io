const User = require('../models/User');

async function attachUser(req, res, next) {
  res.locals.currentUser = null;

  try {
    if (!req.session || !req.session.userId) {
      return next();
    }

    const user = await User.findById(req.session.userId).lean();
    if (user) {
      req.user = user;
      res.locals.currentUser = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachUser;
