// routes/attraction.routes.js
const express              = require('express');
const router               = express.Router();
const { body, param, query } = require('express-validator');
const ctrl                 = require('../controllers/attraction.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles }   = require('../middleware/roleGuard');
const { ROLES }            = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER } = ROLES;

// ── Public routes (no auth required) ─────────────────────────

// GET /api/v1/attractions?category=&city=&status=&season=&page=&limit=
router.get('/', optionalToken, ctrl.listAttractions);

// GET /api/v1/attractions/recommendations?month=&category=&limit=
router.get('/recommendations', optionalToken, ctrl.getSeasonalRecommendations);

// GET /api/v1/attractions/analytics/report  (platform-wide)
router.get('/analytics/report',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  ctrl.getAnalyticsReport
);

// POST /api/v1/attractions/auto-status  (bulk automated status update)
router.post('/auto-status',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  ctrl.bulkAutoUpdateStatus
);

// GET /api/v1/attractions/:id
router.get('/:id', param('id').isInt(), optionalToken, ctrl.getAttraction);

// GET /api/v1/attractions/:id/analytics  (monthly/yearly trends)
router.get('/:id/analytics', param('id').isInt(), ctrl.getAttractionAnalytics);

// ── Protected routes ──────────────────────────────────────────

// POST /api/v1/attractions  (Admin, Tourism_Authority)
router.post('/',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  [
    body('name').trim().notEmpty().isLength({ max: 150 }),
    body('category').isIn(['Beach','Mountain','Historical','Cultural','Wildlife','Adventure','Urban','Religious']),
    body('entry_fee').optional().isFloat({ min: 0 }),
  ],
  ctrl.createAttraction
);

// PUT /api/v1/attractions/:id
router.put('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.updateAttraction
);

// PATCH /api/v1/attractions/:id/status  (change operational_status)
router.patch('/:id/status',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  body('operational_status').isIn(['Open','Closed','Seasonal','Under_Maintenance']),
  ctrl.updateStatus
);

// DELETE /api/v1/attractions/:id  (soft-delete via is_active=0)
router.delete('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.deleteAttraction
);

// POST /api/v1/attractions/:id/images
router.post('/:id/images',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.addImage
);

// POST /api/v1/attractions/:id/seasonal-availability
router.post('/:id/seasonal-availability',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.setSeasonalAvailability
);

module.exports = router;
