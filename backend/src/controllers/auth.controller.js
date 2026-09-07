import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);

  // SameSite=Lax in every environment: the production topology is same-site
  // (api.<domain> alongside <domain>, or a proxied /api/*) — see
  // BACKEND_FINAL_PLAN.md §0.3.3. SameSite=None is the cross-site setting
  // and is not needed here; using it would also require even stricter CSRF
  // defenses than the same-site custom-header approach (7.3) provides.
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
