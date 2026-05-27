import 'dotenv/config';
import { validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

// Crash immediately if required env vars are missing
validateEnv();

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

// Handle unhandled promise rejections (async errors that slipped through)
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  process.exit(1);
});
