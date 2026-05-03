// config/jwt.js — JWT configuration constants
require('dotenv').config();

module.exports = {
  JWT_SECRET:          process.env.JWT_SECRET          || 'fallback_secret_not_for_prod',
  JWT_EXPIRES_IN:      process.env.JWT_EXPIRES_IN      || '7d',
  JWT_REFRESH_SECRET:  process.env.JWT_REFRESH_SECRET  || 'fallback_refresh_not_for_prod',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // All valid roles in the system
  ROLES: {
    TOURIST:           'Tourist',
    SERVICE_PROVIDER:  'Service_Provider',
    ADMIN:             'Admin',
    SUPPORT_AGENT:     'Support_Agent',
    TOURISM_AUTHORITY: 'Tourism_Authority',
  },
};
