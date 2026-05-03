// middleware/auth.js — JWT verification middleware
// Attaches decoded user payload to req.user on success.
const jwt  = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

/**
 * verifyToken
 * Requires a valid Bearer token in the Authorization header.
 * On success: sets req.user = { user_id, email, role, iat, exp }
 * On failure: returns 401 / 403
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // { user_id, email, role, full_name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * optionalToken
 * Soft authentication — attaches req.user if a valid token is present,
 * but does NOT block the request when no token is provided.
 * Useful for public browsing routes that also serve personalised content.
 */
const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = { verifyToken, optionalToken };
