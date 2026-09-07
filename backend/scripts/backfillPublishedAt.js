import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';

const COLLECTIONS = ['projects', 'posts'];

// Backfill for B2: before the update() rewrite in project.service.js /
// post.service.js, publishing a draft via PATCH never set publishedAt (the
// pre('save') hook that sets it doesn't fire for findByIdAndUpdate). Rows
// published that way before the fix may still be missing it.
export async function backfillPublishedAt() {
  const now = new Date();
  const results = {};

  for (const name of COLLECTIONS) {
    const collection = mongoose.connection.collection(name);
    const filter = {
      status: 'published',
      $or: [{ publishedAt: { $exists: false } }, { publishedAt: null }],
    };
    const result = await collection.updateMany(filter, [
      { $set: { publishedAt: { $ifNull: ['$updatedAt', now] } } },
    ]);
    results[name] = { matched: result.matchedCount, modified: result.modifiedCount };
  }

  return results;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const results = await backfillPublishedAt();
  for (const [name, { matched, modified }] of Object.entries(results)) {
    console.log(`${name}: backfilled ${modified} of ${matched} matched document(s).`);
  }
  await mongoose.disconnect();
}

// Only run as a CLI script when executed directly — importing this module
// for backfillPublishedAt (e.g. in tests) must not connect to a database.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
