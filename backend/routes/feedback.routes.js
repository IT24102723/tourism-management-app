// routes/feedback.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/feedback.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT, TOURIST } = ROLES;

// GET /api/v1/feedback?target_type=&target_id=&page=
router.get('/', optionalToken, ctrl.listFeedback);

// POST /api/v1/feedback  — authenticated users only
router.post('/',
  verifyToken,
  [
    body('target_type').isIn(['Attraction','Package','Provider','Schedule','Vehicle']),
    body('target_id').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review_text').optional().trim().isLength({ max: 2000 }),
  ],
  ctrl.submitFeedback
);

// ── Named routes MUST come BEFORE /:id to avoid being caught by the param ──

// GET /api/v1/feedback/best-services  — top rated services by category
router.get('/best-services', optionalToken, ctrl.getBestServices);

// GET /api/v1/feedback/summary/:targetType/:targetId
router.get('/summary/:targetType/:targetId',
  optionalToken,
  ctrl.getFeedbackSummary
);

// ── Parameterized routes ────────────────────────────────────────────────────

// GET /api/v1/feedback/:id
router.get('/:id', param('id').isInt(), optionalToken, ctrl.getFeedback);

// PUT /api/v1/feedback/:id  — tourist edits own review; admin can edit any
router.put('/:id',
  verifyToken,
  authorizeRoles(TOURIST, ADMIN, TOURISM_AUTHORITY),
  [
    param('id').isInt({ min: 1 }),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('review_text').optional().trim().isLength({ max: 2000 }),
  ],
  ctrl.updateFeedback
);

// DELETE /api/v1/feedback/:id  (own feedback or Admin)
router.delete('/:id',
  verifyToken,
  param('id').isInt(),
  ctrl.deleteFeedback
);

// PATCH /api/v1/feedback/:id/flag  (Admin / Support_Agent)
router.patch('/:id/flag',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT),
  param('id').isInt(),
  ctrl.flagFeedback
);

// POST /api/v1/feedback/:id/respond  (Admin responds to feedback)
router.post('/:id/respond',
  verifyToken,
  authorizeRoles(ADMIN, TOURISM_AUTHORITY, SUPPORT_AGENT),
  [
    param('id').isInt(),
    body('response_text').trim().notEmpty().withMessage('Response text is required.'),
  ],
  ctrl.respondToFeedback
);

module.exports = router;
