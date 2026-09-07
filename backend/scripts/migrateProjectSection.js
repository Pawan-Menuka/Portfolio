import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';

export const CATEGORY_TO_SECTION = {
  software: 'full-stack',
  blockchain: 'blockchain',
  cnc: 'hardware',
};

// Operates on the raw collection, not the Project model — the model's schema
// no longer has `category` and now requires `section`, so a model-level
// update would fight its own validators mid-migration.
export async function migrateProjectSection() {
  const projects = mongoose.connection.collection('projects');
  const total = await projects.countDocuments();

  if (total === 0) {
    console.log('projects collection is empty — nothing to migrate.');
    return { matched: 0, modified: 0 };
  }

  let matched = 0;
  let modified = 0;
  for (const [category, section] of Object.entries(CATEGORY_TO_SECTION)) {
    const result = await projects.updateMany(
      { category },
      { $set: { section }, $unset: { category: '' } }
    );
    matched += result.matchedCount;
    modified += result.modifiedCount;
  }

  console.log(`Migrated ${modified} of ${matched} matched project(s) from category to section.`);
  return { matched, modified };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await migrateProjectSection();
  await mongoose.disconnect();
}

// Only run as a CLI script when executed directly — importing this module
// (e.g. tests importing CATEGORY_TO_SECTION) must not connect to a database.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
