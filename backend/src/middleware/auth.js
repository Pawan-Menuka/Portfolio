import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  req.user = user;
  next();
});

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER_NAME = 'x-requested-with';
const CSRF_HEADER_VALUE = 'portfolio-admin';

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin only.');
  }

  // CSRF (7.3): SameSite=Lax already blocks a cross-site fetch/XHR from
  // carrying the auth cookie, but a plain cross-site <form method="post">
  // top-level navigation is a residual vector some browsers still attach
  // Lax cookies to. A form cannot set custom headers — only script can — so
  // requiring one closes that gap: X-Requested-With is deliberately not a
  // CORS-safelisted header, so a cross-origin script trying to set it
  // triggers a preflight the CORS allowlist (7.1) rejects for any origin
  // not on it. Do NOT remove this as "redundant" with SameSite — it covers
  // exactly the case SameSite alone does not.
  if (!SAFE_METHODS.has(req.method)) {
    if (req.get(CSRF_HEADER_NAME) !== CSRF_HEADER_VALUE) {
      throw new ApiError(403, 'Missing or invalid CSRF header.');
    }
  }

  next();
};
