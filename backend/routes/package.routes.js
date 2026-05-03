// routes/package.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/package.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER } = ROLES;

// ── Public ──────────────────────────────────────────────────

// GET /api/v1/packages?type=&min_price=&max_price=&days=&page=&limit=
router.get('/', optionalToken, ctrl.listPackages);

// GET /api/v1/packages/my  — provider's own packages
router.get('/my',
  verifyToken,
  authorizeRoles(SERVICE_PROVIDER, ADMIN, TOURISM_AUTHORITY),
  ctrl.listMyPackages
);

// GET /api/v1/packages/all  — Admin: all packages (active + inactive)
router.get('/all',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  ctrl.listAllPackages
);

// GET /api/v1/packages/:id
router.get('/:id', param('id').isInt(), optionalToken, ctrl.getPackage);

// ── Protected ────────────────────────────────────────────────

// POST /api/v1/packages  (Admin, Tourism_Authority, Service_Provider)
router.post('/',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  [
    body('title').trim().notEmpty().isLength({ max: 150 }),
    body('duration_days').isInt({ min: 1 }),
    body('price_per_person').isFloat({ min: 0 }),
    body('package_type').optional({ checkFalsy: true }).isIn(['Leisure', 'Adventure', 'Cultural', 'Wildlife', 'Budget', 'Standard', 'Premium']),
  ],
  ctrl.createPackage
);

// PUT /api/v1/packages/:id
router.put('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.updatePackage
);

// DELETE /api/v1/packages/:id
router.delete('/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.deletePackage
);

// DELETE /api/v1/packages/:id/hard  — Admin: permanent delete
router.delete('/:id/hard',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.hardDeletePackage
);

// POST /api/v1/packages/:id/attractions  (add attraction to itinerary)
router.post('/:id/attractions',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  [
    body('attraction_id').isInt(),
    body('visit_day').isInt({ min: 1 }),
    body('visit_order').optional().isInt({ min: 1 }),
    body('duration_hours').optional().isFloat({ min: 0 }),
  ],
  ctrl.addAttraction
);

// DELETE /api/v1/packages/:id/attractions/:attrId
router.delete('/:id/attractions/:attrId',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  ctrl.removeAttraction
);

// POST /api/v1/packages/:id/auto-select
//   Automatically select suitable attractions based on availability & category
router.post('/:id/auto-select',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.autoSelectAttractions
);

// GET /api/v1/packages/:id/cost-estimate?num_adults=&num_children=
router.get('/:id/cost-estimate',
  optionalToken,
  param('id').isInt(),
  ctrl.getCostEstimate
);

module.exports = router;
