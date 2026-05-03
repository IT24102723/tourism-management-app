// middleware/roleGuard.js — Role-based access control (RBAC) middleware
// Must be used AFTER verifyToken middleware.
const { ROLES } = require('../config/jwt');

/**
 * authorizeRoles(...allowedRoles)
 * Factory that returns a middleware allowing only the specified roles.
 *
 * Usage example:
 *   router.get('/admin-data', verifyToken, authorizeRoles(ROLES.ADMIN), handler);
 *   router.post('/package',   verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.TOURISM_AUTHORITY), handler);
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * isSelf(paramName)
 * Ensures a user can only access/modify their own resource,
 * unless they are an Admin or Tourism_Authority.
 *
 * Usage:
 *   router.put('/users/:userId', verifyToken, isSelf('userId'), handler);
 */
const isSelf = (paramName = 'userId') => {
  return (req, res, next) => {
    const { ADMIN, TOURISM_AUTHORITY } = ROLES;
    const privilegedRoles = [ADMIN, TOURISM_AUTHORITY];

    if (privilegedRoles.includes(req.user?.role)) return next();

    const resourceId = Number(req.params[paramName]);
    if (req.user?.user_id !== resourceId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own resources.',
      });
    }
    next();
  };
};

module.exports = { authorizeRoles, isSelf };
