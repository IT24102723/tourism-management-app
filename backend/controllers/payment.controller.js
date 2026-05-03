// controllers/payment.controller.js
// Module 4 (Mongo): Payments & Discounts
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse, applyDiscounts } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const { ROLES } = require('../config/jwt');
const {
  Payment,
  Booking,
  DiscountRule,
  User,
} = require('../models');

exports.listPayments = async (req, res, next) => {
  try {
    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    const where = isAdmin ? {} : { user_id: req.user.user_id };

    const rows = await Payment.find(where).sort({ created_at: -1 }).lean();

    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const bookingIds = [...new Set(rows.map((r) => r.booking_id).filter(Boolean))];

    const [users, bookings] = await Promise.all([
      userIds.length ? User.find({ user_id: { $in: userIds } }, { user_id: 1, username: 1, email: 1 }).lean() : [],
      bookingIds.length ? Booking.find({ booking_id: { $in: bookingIds } }, { booking_id: 1, booking_status: 1, booking_type: 1, travel_date: 1 }).lean() : [],
    ]);

    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const bookingMap = new Map(bookings.map((b) => [b.booking_id, b]));

    const payments = rows.map((r) => ({
      ...r,
      username: userMap.get(r.user_id)?.username || null,
      email: userMap.get(r.user_id)?.email || null,
      booking_status: bookingMap.get(r.booking_id)?.booking_status || null,
      booking_type: bookingMap.get(r.booking_id)?.booking_type || null,
      travel_date: bookingMap.get(r.booking_id)?.travel_date || null,
    }));

    return successResponse(res, { payments });
  } catch (err) { next(err); }
};

exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ payment_id: Number(req.params.id) }).lean();
    if (!payment) return errorResponse(res, 'Payment not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && payment.user_id !== req.user.user_id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    return successResponse(res, payment);
  } catch (err) { next(err); }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { booking_id, payment_method, amount } = req.body;

    const booking = await Booking.findOne({ booking_id: Number(booking_id) }).lean();
    if (!booking) return errorResponse(res, 'Booking not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && booking.user_id !== req.user.user_id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    if (['Cancelled', 'Refunded'].includes(booking.booking_status)) {
      return errorResponse(res, `Cannot pay for booking with status: ${booking.booking_status}.`, 409);
    }

    const existingOpen = await Payment.findOne({
      booking_id: Number(booking_id),
      user_id: booking.user_id,
      payment_status: 'Pending',
    }, { payment_id: 1 }).lean();

    if (existingOpen) {
      return successResponse(res, { payment_id: existingOpen.payment_id }, 'Pending payment already exists.');
    }

    const payment_id = await getNextNumericId(Payment, 'payment_id');
    const transaction_ref = `TSS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await Payment.create({
      payment_id,
      booking_id: Number(booking_id),
      user_id: booking.user_id,
      amount: Number(amount),
      currency: 'LKR',
      payment_method,
      transaction_ref,
      payment_status: 'Pending',
      gateway_response: null,
      paid_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return successResponse(res, { payment_id, transaction_ref }, 'Payment initiated.', 201);
  } catch (err) { next(err); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ payment_id: Number(req.params.id) }).lean();
    if (!payment) return errorResponse(res, 'Payment not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && payment.user_id !== req.user.user_id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    if (payment.payment_status === 'Completed') {
      return successResponse(res, { payment_id: payment.payment_id }, 'Payment already confirmed.');
    }

    await Payment.updateOne(
      { payment_id: Number(req.params.id) },
      {
        $set: {
          payment_status: 'Completed',
          gateway_response: JSON.stringify({ status: 'success', code: '00', msg: 'Approved' }),
          paid_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    await Booking.updateOne(
      { booking_id: Number(payment.booking_id) },
      { $set: { booking_status: 'Confirmed', updated_at: new Date() } }
    );

    return successResponse(res, { payment_id: payment.payment_id }, 'Payment confirmed.');
  } catch (err) { next(err); }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ payment_id: Number(req.params.id) }).lean();
    if (!payment) return errorResponse(res, 'Payment not found.', 404);

    if (payment.payment_status !== 'Completed') {
      return errorResponse(res, 'Only completed payments can be refunded.', 409);
    }

    await Payment.updateOne(
      { payment_id: Number(req.params.id) },
      {
        $set: {
          payment_status: 'Refunded',
          gateway_response: JSON.stringify({ status: 'refund', code: 'RF', msg: 'Refunded by admin' }),
          updated_at: new Date(),
        },
      }
    );

    await Booking.updateOne(
      { booking_id: Number(payment.booking_id) },
      { $set: { booking_status: 'Refunded', updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Payment refunded.');
  } catch (err) { next(err); }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ payment_id: Number(req.params.id) }).lean();
    if (!payment) return errorResponse(res, 'Payment not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin) {
      return errorResponse(res, 'Access denied. Only admins can manually update payment records.', 403);
    }

    const { amount, payment_method, payment_status, transaction_ref } = req.body;
    const updates = { updated_at: new Date() };

    if (amount !== undefined) updates.amount = Number(amount);
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (transaction_ref !== undefined) updates.transaction_ref = transaction_ref;

    await Payment.updateOne({ payment_id: Number(req.params.id) }, { $set: updates });

    // If status updated to Completed or Refunded manually, update booking status accordingly
    if (payment_status === 'Completed') {
      await Booking.updateOne({ booking_id: Number(payment.booking_id) }, { $set: { booking_status: 'Confirmed' }});
    } else if (payment_status === 'Refunded') {
      await Booking.updateOne({ booking_id: Number(payment.booking_id) }, { $set: { booking_status: 'Refunded' }});
    }

    return successResponse(res, {}, 'Payment record updated successfully.');
  } catch (err) { next(err); }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ payment_id: Number(req.params.id) }).lean();
    if (!payment) return errorResponse(res, 'Payment not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin) {
      return errorResponse(res, 'Access denied. Only admins can delete payment records.', 403);
    }

    await Payment.deleteOne({ payment_id: Number(req.params.id) });
    return successResponse(res, {}, 'Payment record deleted successfully.');
  } catch (err) { next(err); }
};

exports.calculateDiscount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { amount, booking_type = 'All', num_persons = 1, travel_date } = req.body;
    const baseAmount = Number(amount);

    const today = new Date();
    const rules = await DiscountRule.find({
      is_active: 1,
      $or: [{ applicable_to: booking_type }, { applicable_to: 'All' }],
      $and: [
        { $or: [{ valid_from: null }, { valid_from: { $lte: today } }] },
        { $or: [{ valid_until: null }, { valid_until: { $gte: today } }] },
      ],
    }).lean();

    const advanceDays = travel_date
      ? Math.floor((new Date(travel_date) - today) / 86400000)
      : 0;

    const { discount, final } = applyDiscounts(baseAmount, rules, {
      numPersons: Number(num_persons),
      advanceDays,
    });

    return successResponse(res, {
      amount: baseAmount,
      discount_amount: discount,
      final_amount: final,
      applied_rules: rules.map((r) => ({
        rule_id: r.rule_id,
        rule_name: r.rule_name,
        rule_type: r.rule_type,
        discount_value: Number(r.discount_value || 0),
      })),
    });
  } catch (err) { next(err); }
};

exports.listDiscountRules = async (req, res, next) => {
  try {
    const now = new Date();
    const rows = await DiscountRule.find({
      is_active: 1,
      $and: [
        { $or: [{ valid_from: null }, { valid_from: { $lte: now } }] },
        { $or: [{ valid_until: null }, { valid_until: { $gte: now } }] },
      ],
    }).sort({ created_at: -1 }).lean();

    return successResponse(res, { discount_rules: rows });
  } catch (err) { next(err); }
};

exports.createDiscountRule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      rule_name,
      rule_type,
      discount_value,
      min_persons = 1,
      min_advance_days = 0,
      valid_from,
      valid_until,
      applicable_to = 'All',
      is_active = 1,
    } = req.body;

    const rule_id = await getNextNumericId(DiscountRule, 'rule_id');

    await DiscountRule.create({
      rule_id,
      rule_name,
      rule_type,
      discount_value: Number(discount_value),
      min_persons: Number(min_persons),
      min_advance_days: Number(min_advance_days),
      valid_from: valid_from ? new Date(valid_from) : null,
      valid_until: valid_until ? new Date(valid_until) : null,
      applicable_to,
      is_active: Number(is_active) ? 1 : 0,
      created_at: new Date(),
    });

    return successResponse(res, { rule_id }, 'Discount rule created.', 201);
  } catch (err) { next(err); }
};
