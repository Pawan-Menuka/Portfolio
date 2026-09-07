import jwt from 'jsonwebtoken';
import { User } from '../../src/models/User.js';

const JWT_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = JWT_SECRET;

export async function createAdminUser(email = 'admin@example.com') {
  return User.create({ email, passwordHash: 'irrelevant-hash', role: 'admin' });
}

// The User schema's role enum only ever allows 'admin' today, so a non-admin
// account can't be created through normal validation. Insert one directly via
// the native collection to exercise adminOnly's rejection path against a real
// request rather than assuming it works.
export async function createNonAdminUser(email = 'viewer@example.com') {
  const now = new Date();
  const { insertedId } = await User.collection.insertOne({
    email,
    passwordHash: 'irrelevant-hash',
    role: 'viewer',
    createdAt: now,
    updatedAt: now,
  });
  return { _id: insertedId };
}

export function authCookieFor(userId) {
  const token = jwt.sign({ id: userId, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  return `token=${token}`;
}

// State-changing admin requests need the CSRF header (7.3) in addition to
// the auth cookie — see middleware/auth.js's adminOnly for why. Use this
// wherever a test performs an admin write; guard tests expecting 401/403
// for unrelated reasons (missing cookie, non-admin role) don't need it,
// since those checks run before the CSRF check.
export function adminHeaders(userId) {
  return {
    Cookie: authCookieFor(userId),
    'X-Requested-With': 'portfolio-admin',
  };
}
