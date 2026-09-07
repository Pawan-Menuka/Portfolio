import 'dotenv/config';
import mongoose from 'mongoose';
import { Profile } from '../src/models/Profile.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Profile.findOne({ singleton: 'main' });
  if (existing) {
    console.log('Profile already exists. Nothing to do.');
    process.exit(0);
  }

  await Profile.create({
    singleton: 'main',
    name: 'Pawan',
    headline: 'Software Engineer',
    shortBio: 'Placeholder bio — edit via PATCH /api/v1/profile.',
  });

  console.log('Placeholder profile created. Edit it via PATCH /api/v1/profile.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
