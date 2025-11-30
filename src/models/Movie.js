const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
  },
  year: {
    type: Number,
    required: true,
    min: 1888,
    max: new Date().getFullYear() + 1,
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
  },
  genres: [{
    type: String,
    trim: true,
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Movie', movieSchema);
