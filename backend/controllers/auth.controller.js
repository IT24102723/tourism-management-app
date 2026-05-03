// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, ServiceProvider } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/helpers');

// ── Helpers ───────────────────────────────────────────────────
const signAccess = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const signRefresh = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

// ── Register ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { username, email, password, role = 'Tourist', full_name, phone } = req.body;

    // Check duplicates
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing)
      return errorResponse(res, 'Email or username already taken.', 409);

    const password_hash = await bcrypt.hash(password, 12);

    const lastUser = await User.findOne({}, { user_id: 1 }).sort({ user_id: -1 }).lean();
    const user_id = (lastUser?.user_id || 0) + 1;

    await User.create({
      user_id,
      username,
      email,
      password_hash,
      role,
      full_name: full_name || null,
      phone: phone || null,
      is_active: 1,
      email_verified: 0,
      profile_image: null,
    });

    const tokenPayload = { user_id, email, role, full_name: full_name || null };

    if (role === 'Service_Provider') {
      const lastProvider = await ServiceProvider.findOne({}, { provider_id: 1 }).sort({ provider_id: -1 }).lean();
      const provider_id = (lastProvider?.provider_id || 0) + 1;
      await ServiceProvider.create({
        provider_id,
        user_id,
        business_name: full_name || username,
        business_type: 'Tour Operator',
        contact_number: phone || null,
        status: 'Active',
        average_rating: 0,
        rating_count: 0
      });
    }

    return successResponse(res, {
      access_token:  signAccess(tokenPayload),
      refresh_token: signRefresh({ user_id }),
      user: { user_id, username, email, role, full_name, profile_image: null },
    }, 'Registration successful.', 201);
  } catch (err) { next(err); }
};

// ── Login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { email, password } = req.body;

    const user = await User.findOne(
      { email },
      { user_id: 1, username: 1, email: 1, password_hash: 1, role: 1, full_name: 1, profile_image: 1, is_active: 1 }
    ).lean();

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return errorResponse(res, 'Invalid email or password.', 401);

    if (!user.is_active)
      return errorResponse(res, 'Account is deactivated. Contact support.', 403);

    const tokenPayload = { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name };

    return successResponse(res, {
      access_token:  signAccess(tokenPayload),
      refresh_token: signRefresh({ user_id: user.user_id }),
      user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role, full_name: user.full_name, profile_image: user.profile_image },
    }, 'Login successful.');
  } catch (err) { next(err); }
};

// ── Refresh Token ─────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token)
      return errorResponse(res, 'Refresh token required.', 400);

    let decoded;
    try { decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET); }
    catch { return errorResponse(res, 'Invalid or expired refresh token.', 401); }

    const user = await User.findOne(
      { user_id: decoded.user_id, is_active: 1 },
      { user_id: 1, email: 1, role: 1, full_name: 1 }
    ).lean();
    if (!user)
      return errorResponse(res, 'User not found.', 404);

    const tokenPayload = { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name };

    return successResponse(res, {
      access_token: signAccess(tokenPayload),
    }, 'Token refreshed.');
  } catch (err) { next(err); }
};

// ── Get Me ────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findOne(
      { user_id: req.user.user_id },
      { _id: 0, user_id: 1, username: 1, email: 1, role: 1, full_name: 1, phone: 1, profile_image: 1, is_active: 1, email_verified: 1, created_at: 1 }
    ).lean();
    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, user);
  } catch (err) { next(err); }
};

// ── Logout (client-side; server logs) ────────────────────────
exports.logout = (req, res) => {
  // JWT is stateless. Instruct client to discard token.
  // Implement a token blacklist (Redis) for stricter invalidation in production.
  return successResponse(res, {}, 'Logged out successfully. Please remove your token.');
};

// ── Change Password ───────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { current_password, new_password } = req.body;

    const user = await User.findOne({ user_id: req.user.user_id }, { password_hash: 1 }).lean();
    if (!user) return errorResponse(res, 'User not found.', 404);

    if (!(await bcrypt.compare(current_password, user.password_hash)))
      return errorResponse(res, 'Current password is incorrect.', 401);

    const new_hash = await bcrypt.hash(new_password, 12);
    await User.updateOne({ user_id: req.user.user_id }, { $set: { password_hash: new_hash, updated_at: new Date() } });

    return successResponse(res, {}, 'Password updated successfully.');
  } catch (err) { next(err); }
};

// ── Update Profile ────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, profile_image } = req.body;
    const patch = {};
    if (full_name !== undefined) patch.full_name = full_name;
    if (phone !== undefined)     patch.phone = phone;
    if (profile_image !== undefined) patch.profile_image = profile_image;
    
    patch.updated_at = new Date();

    const result = await User.findOneAndUpdate(
      { user_id: Number(req.user.user_id) }, 
      { $set: patch },
      { new: true, projection: { password_hash: 0 } }
    ).lean();

    if (!result) return errorResponse(res, 'User not found.', 404);

    return successResponse(res, { user: result }, 'Profile updated successfully.');
  } catch (err) { next(err); }
};
