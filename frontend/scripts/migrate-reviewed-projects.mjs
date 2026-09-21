// Narrow migration for the two reviewed legacy projects; dry run by default.
import mongoose from '../../backend/node_modules/mongoose/index.js';
import dotenv from '../../backend/node_modules/dotenv/lib/main.js';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
dotenv.config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)), quiet: true });
const ids = ['6a162f1d19517c94aacda865', '6a162cbc19517c94aacda863'].map(id => new mongoose.Types.ObjectId(id));
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const projects = mongoose.connection.collection('projects');
  const records = await projects.find({ _id: { $in: ids } }, { projection: { title: 1, category: 1, section: 1 } }).toArray();
  if (records.length !== 2) throw new Error('Expected exactly two reviewed projects; stopped.');
  const eligible = records.filter(record => record.category === 'cnc' && !Object.hasOwn(record, 'section'));
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', records, eligible: eligible.length }));
  if (process.argv.includes('--apply')) {
    if (eligible.length !== 2) throw new Error('Reviewed fields changed; stopped without writing.');
    const directory = new URL('../.local/', import.meta.url);
    mkdirSync(directory, { recursive: true });
    const snapshot = new URL(`project-section-before-${Date.now()}.json`, directory);
    writeFileSync(snapshot, JSON.stringify(records, null, 2), { flag: 'wx' });
    const result = await projects.updateMany(
      { _id: { $in: ids }, category: 'cnc', section: { $exists: false } },
      { $set: { section: 'hardware' }, $unset: { category: '' } },
    );
    console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount, snapshot: fileURLToPath(snapshot) }));
    if (result.modifiedCount !== 2) throw new Error('Unexpected write count; inspect the snapshot and current records.');
  }
} finally { await mongoose.disconnect(); }
