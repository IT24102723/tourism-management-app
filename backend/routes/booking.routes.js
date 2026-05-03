// routes/booking.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/booking.controller');
const { verifyToken }    = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, TOURIST } = ROLES;

// All booking routes require authentication
router.use(verifyToken);

// GET /api/v1/bookings        — Tourist: own bookings; Admin: all
router.get('/', ctrl.listBookings);

// GET /api/v1/bookings/:id
router.get('/:id', param('id').isInt(), ctrl.getBooking);

// POST /api/v1/bookings
router.post('/',
  [
    body('booking_type').isIn(['Package','Attraction','Transport']),
    body('travel_date').isDate().withMessage('Valid travel_date (YYYY-MM-DD) required.'),
    body('num_adults').optional().isInt({ min: 1 }),
    body('num_children').optional().isInt({ min: 0 }),
  ],
  ctrl.createBooking
);

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', param('id').isInt(), ctrl.cancelBooking);

// PATCH /api/v1/bookings/:id/add-transport  — Tourist: attach schedule to existing pending booking
router.patch(
  '/:id/add-transport',
  param('id').isInt(),
  body('schedule_id').isInt(),
  body('transport_amount').optional().isNumeric(),
  ctrl.addTransport
);

// PATCH /api/v1/bookings/:id/status  (Admin / Tourism_Authority)
router.patch('/:id/status',
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  body('booking_status').isIn(['Pending','Confirmed','Cancelled','Completed','Refunded']),
  ctrl.updateStatus
);

module.exports = router;

