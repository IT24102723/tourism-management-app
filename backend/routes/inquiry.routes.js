// routes/inquiry.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/inquiry.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT } = ROLES;

// POST /api/v1/inquiries  — anyone (including guests) can submit
router.post('/',
  optionalToken,
  [
    body('subject').trim().notEmpty().isLength({ max: 255 }),
    body('message').trim().notEmpty(),
    body('category').optional().isIn(['General','Booking','Payment','Complaint','Suggestion','Technical']),
    body('priority').optional().isIn(['Low','Medium','High','Urgent']),
  ],
  ctrl.submitInquiry
);

// ── Authenticated routes ──────────────────────────────────────

// GET /api/v1/inquiries  — Tourist: own; Agent/Admin: all
router.get('/', verifyToken, ctrl.listInquiries);

// GET /api/v1/inquiries/:id
router.get('/:id', verifyToken, param('id').isInt(), ctrl.getInquiry);

// POST /api/v1/inquiries/:id/respond  (Support_Agent, Admin)
router.post('/:id/respond',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT),
  param('id').isInt(),
  body('message').trim().notEmpty(),
  ctrl.respondToInquiry
);

// PATCH /api/v1/inquiries/:id/status  (advance workflow)
router.patch('/:id/status',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT),
  param('id').isInt(),
  body('status').isIn(['Submitted','Pending','Responded','Closed']),
  ctrl.updateStatus
);

// PATCH /api/v1/inquiries/:id/assign  (assign agent)
router.patch('/:id/assign',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  body('agent_id').isInt(),
  ctrl.assignAgent
);

module.exports = router;
