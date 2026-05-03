// routes/provider.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/provider.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER } = ROLES;

// ── Public ────────────────────────────────────────────────────

// GET /api/v1/providers?type=&city=&min_rating=&page=
router.get('/', optionalToken, ctrl.listProviders);

// GET /api/v1/providers/me   (owner — returns own profile regardless of status, must come BEFORE /:id)
router.get('/me',
  verifyToken,
  authorizeRoles(SERVICE_PROVIDER, ADMIN, TOURISM_AUTHORITY),
  ctrl.getMyProvider
);

// GET /api/v1/providers/me/stats   (dashboard stats for logged-in provider)
router.get('/me/stats',
  verifyToken,
  authorizeRoles(SERVICE_PROVIDER, ADMIN, TOURISM_AUTHORITY),
  ctrl.getMyStats
);

// GET /api/v1/providers/all   (Admin — all statuses, must come BEFORE /:id)
router.get('/all',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  ctrl.listAllProviders
);

// GET /api/v1/providers/rankings  (public — Active providers ranked by rating)
router.get('/rankings', optionalToken, ctrl.getProviderRankings);

// GET /api/v1/providers/:id
router.get('/:id', param('id').isInt(), optionalToken, ctrl.getProvider);

// ── Protected ─────────────────────────────────────────────────

// POST /api/v1/providers  (Service_Provider registers their business)
router.post('/',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  [
    body('business_name').trim().notEmpty().isLength({ max: 150 }),
    body('business_type').isIn(['Hotel','Transport','Tour_Guide','Restaurant','Activity']),
    body('contact_email').optional().isEmail(),
  ],
  ctrl.createProvider
);

// PUT /api/v1/providers/:id
router.put('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.updateProvider
);

// PATCH /api/v1/providers/:id/verify   (Admin / Tourism_Authority only)
router.patch('/:id/verify',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.verifyProvider
);

// PATCH /api/v1/providers/:id/approve  (Pending → Active)
router.patch('/:id/approve',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.approveProvider
);

// PATCH /api/v1/providers/:id/status   (Active / Inactive / Suspended)
router.patch('/:id/status',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  body('status').isIn(['Active', 'Inactive', 'Suspended']),
  ctrl.updateProviderStatus
);

// DELETE /api/v1/providers/:id
router.delete('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.deleteProvider
);

module.exports = router;
