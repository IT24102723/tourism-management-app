// routes/payment.routes.js
const express            = require('express');
const router             = express.Router();
const { body, param }    = require('express-validator');
const ctrl               = require('../controllers/payment.controller');
const { verifyToken }    = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleGuard');
const { ROLES }          = require('../config/jwt');

const { ADMIN, TOURISM_AUTHORITY } = ROLES;

router.use(verifyToken);

// GET /api/v1/payments              — Tourist: own; Admin: all
router.get('/', ctrl.listPayments);

// GET /api/v1/payments/discount-rules  — list active discount rules (MUST be before /:id)
router.get('/discount-rules', ctrl.listDiscountRules);

// GET /api/v1/payments/:id
router.get('/:id', param('id').isInt(), ctrl.getPayment);

// POST /api/v1/payments             — initiate payment for a booking
router.post('/',
  [
    body('booking_id').isInt(),
    body('payment_method').isIn(['Credit_Card','Debit_Card','Bank_Transfer','Cash','Cash_On_Tour','Online_Wallet','Online_Banking']),
    body('amount').isFloat({ min: 0.01 }),
  ],
  ctrl.initiatePayment
);

// POST /api/v1/payments/:id/confirm  — mark as Completed (simulate gateway callback)
router.post('/:id/confirm',
  param('id').isInt(),
  ctrl.confirmPayment
);

// POST /api/v1/payments/:id/refund   — Admin only
router.post('/:id/refund',
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.refundPayment
);

// PUT /api/v1/payments/:id   — Admin only (Full manual update)
router.put('/:id',
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('payment_method').optional().isIn(['Credit_Card','Debit_Card','Bank_Transfer','Cash','Cash_On_Tour','Online_Wallet','Online_Banking']),
    body('payment_status').optional().isIn(['Pending','Completed','Failed','Refunded','Cancelled']),
  ],
  ctrl.updatePayment
);

// DELETE /api/v1/payments/:id  — Admin only
router.delete('/:id',
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  param('id').isInt(),
  ctrl.deletePayment
);

// POST /api/v1/payments/calculate-discount  — preview discount before paying
router.post('/calculate-discount',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('amount required.'),
    body('booking_type').optional().isIn(['Package','Attraction','Transport']),
    body('num_persons').optional().isInt({ min: 1 }),
    body('travel_date').optional().isDate(),
  ],
  ctrl.calculateDiscount
);

// POST /api/v1/payments/discount-rules  — Admin only
router.post('/discount-rules',
  authorizeRoles(ADMIN, TOURISM_AUTHORITY),
  [
    body('rule_name').trim().notEmpty(),
    body('rule_type').isIn(['Percentage','Fixed','Early_Bird','Group','Seasonal']),
    body('discount_value').isFloat({ min: 0 }),
  ],
  ctrl.createDiscountRule
);

module.exports = router;
