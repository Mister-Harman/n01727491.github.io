const mongoose = require('mongoose');

function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  mongoose.connect(uri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
      console.error('❌ Mongo connection error:', err);
      process.exit(1);
    });
}

module.exports = connectDB;
