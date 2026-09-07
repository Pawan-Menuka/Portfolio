import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

// For tests that need to disconnect/reconnect mongoose mid-test (e.g.
// exercising a "DB down" code path) — reconnecting to this same URI avoids
// spinning up a second mongod instance that never gets stopped, which would
// otherwise leave an open handle and hang the test process on exit.
export function getTestDbUri() {
  return mongod?.getUri();
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function closeTestDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}
