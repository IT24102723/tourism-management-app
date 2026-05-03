// routes/transport.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/transport.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER, TOURIST } = ROLES;

// ── Vehicles ──────────────────────────────────────────────────

// GET /api/v1/transport/vehicles?type=&available=
// optionalToken: tourists can browse without login, admins get full list when logged in
router.get('/vehicles', optionalToken, ctrl.listVehicles);

// GET /api/v1/transport/vehicles/:id
router.get('/vehicles/:id', param('id').isInt(), ctrl.getVehicle);

// POST /api/v1/transport/vehicles
router.post('/vehicles',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  [
    body('vehicle_type').isIn(['Bus','Van','Car','Tuk_Tuk','Boat','Train']),
    body('vehicle_name').trim().notEmpty().withMessage('Vehicle name is required.'),
    body('registration_number').trim().notEmpty(),
    body('capacity').isInt({ min: 1 }),
  ],
  ctrl.createVehicle
);

// PUT /api/v1/transport/vehicles/:id
router.put('/vehicles/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  [
    body('vehicle_type').optional().isIn(['Bus','Van','Car','Tuk_Tuk','Boat','Train']),
    body('registration_number').optional().trim().notEmpty(),
    body('capacity').optional().isInt({ min: 1 }),
    body('price_per_km').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('price_per_day').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  ],
  ctrl.updateVehicle
);

// PATCH /api/v1/transport/vehicles/:id/availability
router.patch('/vehicles/:id/availability',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  body('is_available').isBoolean(),
  ctrl.updateVehicleAvailability
);

// DELETE /api/v1/transport/vehicles/:id
router.delete('/vehicles/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.deleteVehicle
);

// ── Schedules ─────────────────────────────────────────────────

// GET /api/v1/transport/schedules?package_id=&date=
router.get('/schedules', optionalToken, ctrl.listSchedules);

// GET /api/v1/transport/schedules/:id
router.get('/schedules/:id', optionalToken, param('id').isInt(), ctrl.getSchedule);

// POST /api/v1/transport/schedules  — generates schedule + conflict detection
router.post('/schedules',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER, TOURIST),
  [
    body('vehicle_id').isInt({ min: 1 }).withMessage('A valid vehicle must be selected.'),
    body('departure_location').trim().notEmpty(),
    body('arrival_location').trim().notEmpty(),
    body('departure_time').isISO8601(),
    body('arrival_time').isISO8601(),
  ],
  ctrl.createSchedule
);

// PUT /api/v1/transport/schedules/:id
router.put('/schedules/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SERVICE_PROVIDER),
  param('id').isInt(),
  ctrl.updateSchedule
);

// DELETE /api/v1/transport/schedules/:id
router.delete('/schedules/:id',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.deleteSchedule
);

// GET /api/v1/transport/schedules/:id/alternatives
//   Suggest alternative slots when conflict_flag = 1
router.get('/schedules/:id/alternatives',
  optionalToken,
  param('id').isInt(),
  ctrl.suggestAlternatives
);

module.exports = router;
