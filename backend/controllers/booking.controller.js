// controllers/booking.controller.js
// Module 3 (Mongo): Booking Management
const { validationResult } = require('express-validator');
const { successResponse, errorResponse, applyDiscounts } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const { ROLES } = require('../config/jwt');
const {
  Booking,
  User,
  Package,
  Attraction,
  Schedule,
  ServiceProvider,
  DiscountRule,
} = require('../models');

// GET /api/v1/bookings
exports.listBookings = async (req, res, next) => {
  try {
    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    const ACTIVE_FILTER = { $in: [1, true, '1'] };
    const where = isAdmin ? {} : { user_id: req.user.user_id };

    const bookings = await Booking.find(where).sort({ created_at: -1 }).lean();
    const userIds = [...new Set(bookings.map((b) => b.user_id).filter(Boolean))];
    const packageIds = [...new Set(bookings.map((b) => b.package_id).filter(Boolean))];
    const attractionIds = [...new Set(bookings.map((b) => b.attraction_id).filter(Boolean))];

    const [users, packages, attractions] = await Promise.all([
      userIds.length ? User.find({ user_id: { $in: userIds } }, { user_id: 1, username: 1, email: 1 }).lean() : [],
      packageIds.length ? Package.find({ package_id: { $in: packageIds } }, { package_id: 1, title: 1, name: 1 }).lean() : [],
      attractionIds.length ? Attraction.find({ attraction_id: { $in: attractionIds } }, { attraction_id: 1, name: 1 }).lean() : [],
    ]);

    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const pkgMap = new Map(packages.map((p) => [p.package_id, p]));
    const attrMap = new Map(attractions.map((a) => [a.attraction_id, a]));

    const rows = bookings.map((b) => ({
      ...b,
      username: userMap.get(b.user_id)?.username || null,
      email: userMap.get(b.user_id)?.email || null,
      package_title: pkgMap.get(b.package_id)?.title || pkgMap.get(b.package_id)?.name || null,
      attraction_name: attrMap.get(b.attraction_id)?.name || null,
    }));

    return successResponse(res, { bookings: rows });
  } catch (err) { next(err); }
};

// GET /api/v1/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ booking_id: Number(req.params.id) }).lean();
    if (!booking) return errorResponse(res, 'Booking not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && booking.user_id !== req.user.user_id)
      return errorResponse(res, 'Access denied.', 403);

    return successResponse(res, booking);
  } catch (err) { next(err); }
};

// POST /api/v1/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      booking_type,
      package_id,
      attraction_id,
      schedule_id,
      travel_date,
      num_adults = 1,
      num_children = 0,
      special_requests,
    } = req.body;

    let base_amount = 0;
    let transport_amount = 0;

    if (booking_type === 'Package' && package_id) {
      const pkg = await Package.findOne({ package_id: Number(package_id), is_active: { $in: [1, true, '1'] } }).lean();
      if (!pkg) return errorResponse(res, 'Package not found.', 404);

      if (pkg.provider_id) {
        const sp = await ServiceProvider.findOne({ provider_id: Number(pkg.provider_id) }, { status: 1, business_name: 1, name: 1, is_active: 1 }).lean();
        if (sp) {
          const spActive = sp.status === 'Active' || sp.status === 'verified' || sp.is_active === 1 || sp.is_active === true;
          if (!spActive) {
            return errorResponse(res, `Bookings for "${sp.business_name || sp.name || 'this provider'}" are currently unavailable.`, 409);
          }
        }
      }

      if (pkg.max_capacity && pkg.current_bookings >= pkg.max_capacity)
        return errorResponse(res, 'Package is fully booked.', 409);

      const pp = Number(pkg.price_per_person || pkg.price || 0);
      base_amount = pp * (Number(num_adults) + Number(num_children) * 0.5);

      if (schedule_id) {
        const sched = await Schedule.findOne({ schedule_id: Number(schedule_id), status: { $ne: 'Cancelled' } }, { total_cost: 1 }).lean();
        if (sched && sched.total_cost) {
          transport_amount = Number(sched.total_cost);
          base_amount += transport_amount;
        }
      }
    } else if (booking_type === 'Attraction' && attraction_id) {
      const attr = await Attraction.findOne({ attraction_id: Number(attraction_id) }, { entrance_fee: 1, operational_status: 1 }).lean();
      if (!attr) return errorResponse(res, 'Attraction not found.', 404);
      if (attr.operational_status === 'Closed') return errorResponse(res, 'Attraction is currently closed.', 409);
      base_amount = Number(attr.entrance_fee || 0) * (Number(num_adults) + Number(num_children) * 0.5);
    }

    const now = new Date();
    const rules = await DiscountRule.find({
      is_active: 1,
      $or: [{ applicable_to: booking_type }, { applicable_to: 'All' }],
      $and: [
        { $or: [{ valid_from: null }, { valid_from: { $lte: now } }] },
        { $or: [{ valid_until: null }, { valid_until: { $gte: now } }] },
      ],
    }).lean();

    const advanceDays = Math.floor((new Date(travel_date) - new Date()) / 86400000);
    const { discount, final } = applyDiscounts(base_amount, rules, {
      numPersons: Number(num_adults) + Number(num_children),
      advanceDays,
    });

    const booking_id = await getNextNumericId(Booking, 'booking_id');

    await Booking.create({
      booking_id,
      user_id: req.user.user_id,
      package_id: package_id ? Number(package_id) : null,
      schedule_id: schedule_id ? Number(schedule_id) : null,
      attraction_id: attraction_id ? Number(attraction_id) : null,
      booking_type,
      booking_date: new Date(),
      travel_date: new Date(travel_date),
      num_adults: Number(num_adults),
      num_children: Number(num_children),
      base_amount,
      discount_amount: discount,
      final_amount: final,
      booking_status: 'Pending',
      special_requests: special_requests || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (booking_type === 'Package' && package_id) {
      await Package.updateOne(
        { package_id: Number(package_id) },
        { $inc: { current_bookings: 1 }, $set: { updated_at: new Date() } }
      );
    }

    return successResponse(
      res,
      { booking_id, base_amount, transport_amount, discount_amount: discount, final_amount: final },
      'Booking created.',
      201
    );
  } catch (err) { next(err); }
};

// PATCH /api/v1/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ booking_id: Number(req.params.id) }).lean();
    if (!booking) return errorResponse(res, 'Booking not found.', 404);

    if (booking.user_id !== req.user.user_id && ![ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role))
      return errorResponse(res, 'Access denied.', 403);

    if (['Cancelled', 'Completed'].includes(booking.booking_status))
      return errorResponse(res, `Cannot cancel a booking with status: ${booking.booking_status}.`, 409);

    await Booking.updateOne(
      { booking_id: Number(req.params.id) },
      { $set: { booking_status: 'Cancelled', updated_at: new Date() } }
    );

    if (booking.package_id) {
      await Package.updateOne(
        { package_id: Number(booking.package_id), current_bookings: { $gt: 0 } },
        { $inc: { current_bookings: -1 }, $set: { updated_at: new Date() } }
      );
    }

    return successResponse(res, {}, 'Booking cancelled.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/bookings/:id/status  (Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    await Booking.updateOne(
      { booking_id: Number(req.params.id) },
      { $set: { booking_status: req.body.booking_status, updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Booking status updated.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/bookings/:id/add-transport
// Attach a schedule to an existing Pending booking, recalculate totals
exports.addTransport = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ booking_id: Number(req.params.id) }).lean();
    if (!booking) return errorResponse(res, 'Booking not found.', 404);

    if (booking.user_id !== req.user.user_id)
      return errorResponse(res, 'Access denied.', 403);

    if (booking.booking_status !== 'Pending')
      return errorResponse(res, 'Only Pending bookings can be updated.', 409);

    const { schedule_id, transport_amount } = req.body;
    if (!schedule_id) return errorResponse(res, 'schedule_id is required.', 422);

    const tAmount      = Number(transport_amount) || 0;
    const baseAmount   = Number(booking.base_amount)   || 0;
    const newFinal     = baseAmount + tAmount - (Number(booking.discount_amount) || 0);

    await Booking.updateOne(
      { booking_id: Number(req.params.id) },
      {
        $set: {
          schedule_id:      Number(schedule_id),
          transport_amount: tAmount,
          final_amount:     newFinal,
          updated_at:       new Date(),
        },
      }
    );

    return successResponse(res, {
      booking_id:       booking.booking_id,
      base_amount:      baseAmount,
      transport_amount: tAmount,
      discount_amount:  booking.discount_amount || 0,
      final_amount:     newFinal,
    }, 'Transport added to booking.');
  } catch (err) { next(err); }
};
