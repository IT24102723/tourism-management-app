// routes/auth.routes.js
const express = require('express');
const router  = express.Router();
const { body }         = require('express-validator');
const authController   = require('../controllers/auth.controller');
const { verifyToken }  = require('../middleware/auth');

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain a number.'),
  body('role').optional().isIn(['Tourist','Service_Provider']).withMessage('Invalid self-registration role.'),
  body('full_name').optional().trim().isLength({ max: 100 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ── Routes ────────────────────────────────────────────────────
// POST /api/v1/auth/register
router.post('/register', registerRules, authController.register);

// POST /api/v1/auth/login
router.post('/login', loginRules, authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// GET  /api/v1/auth/me  (protected)
router.get('/me', verifyToken, authController.getMe);

// POST /api/v1/auth/logout  (protected — client-side token removal; server logs)
router.post('/logout', verifyToken, authController.logout);

// PUT  /api/v1/auth/change-password  (protected)
router.put('/change-password', verifyToken, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
], authController.changePassword);

// PUT  /api/v1/auth/profile  (protected)
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
