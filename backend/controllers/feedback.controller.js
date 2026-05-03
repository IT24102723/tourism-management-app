// controllers/feedback.controller.js
// Module 6 (Mongo): Feedback & Sentiment
const { validationResult } = require('express-validator');
const { successResponse, errorResponse, classifySentiment } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const { ROLES } = require('../config/jwt');
const {
  Feedback,
  User,
  Booking,
  Attraction,
  Package,
  ServiceProvider,
  Schedule,
  TransportVehicle,
} = require('../models');

exports.listFeedback = async (req, res, next) => {
  try {
    const { target_type, target_id, user_id, sentiment, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (target_type) where.target_type = target_type;
    if (target_id)   where.target_id   = Number(target_id);
    if (user_id)     where.user_id     = Number(user_id);
    if (sentiment)   where.sentiment   = sentiment;

    // Filter by provider if Service Provider
    if (req.user?.role === 'Service_Provider') {
      const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
      if (sp) {
        // Find all their entities
        const [pkgs, vhcls] = await Promise.all([
          Package.find({ provider_id: sp.provider_id }, { package_id: 1 }).lean(),
          TransportVehicle.find({ provider_id: sp.provider_id }, { vehicle_id: 1 }).lean(),
        ]);
        const pkgIds = pkgs.map(p => p.package_id);
        const vhclIds = vhcls.map(v => v.vehicle_id);

        where.$or = [
          { target_type: 'Provider', target_id: sp.provider_id },
          { target_type: 'Package',  target_id: { $in: pkgIds } },
          { target_type: 'Vehicle',  target_id: { $in: vhclIds } },
        ];
      } else {
        where.feedback_id = -1; // Empty if no profile
      }
    }

    const rows = await Feedback.find(where)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ user_id: { $in: userIds } }, { user_id: 1, username: 1, full_name: 1 }).lean()
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    // Resolve Target Names
    const targetMap = new Map();
    const typeIds = { Attraction: new Set(), Package: new Set(), Provider: new Set(), Schedule: new Set(), Vehicle: new Set() };
    rows.forEach(r => { if (typeIds[r.target_type]) typeIds[r.target_type].add(r.target_id); });

    const [attractions, packages, providers, schedules, vehicles] = await Promise.all([
      typeIds.Attraction.size ? Attraction.find({ attraction_id: { $in: [...typeIds.Attraction] } }, { attraction_id: 1, name: 1 }).lean() : [],
      typeIds.Package.size ? Package.find({ package_id: { $in: [...typeIds.Package] } }, { package_id: 1, title: 1 }).lean() : [],
      typeIds.Provider.size ? ServiceProvider.find({ provider_id: { $in: [...typeIds.Provider] } }, { provider_id: 1, business_name: 1, business_type: 1 }).lean() : [],
      typeIds.Schedule.size ? Schedule.find({ schedule_id: { $in: [...typeIds.Schedule] } }, { schedule_id: 1, start_location: 1, end_location: 1 }).lean() : [],
      typeIds.Vehicle.size ? TransportVehicle.find({ vehicle_id: { $in: [...typeIds.Vehicle] } }, { vehicle_id: 1, vehicle_name: 1, vehicle_type: 1, registration_number: 1 }).lean() : [],
    ]);

    attractions.forEach(a => targetMap.set(`Attraction_${a.attraction_id}`, a.name));
    packages.forEach(p => targetMap.set(`Package_${p.package_id}`, p.title));
    providers.forEach(p => targetMap.set(`Provider_${p.provider_id}`, `${p.business_name} (${p.business_type})`));
    schedules.forEach(s => targetMap.set(`Schedule_${s.schedule_id}`, `${s.start_location} to ${s.end_location}`));
    vehicles.forEach(v => targetMap.set(`Vehicle_${v.vehicle_id}`, v.vehicle_name || `${v.vehicle_type} (${v.registration_number})`));

    const feedback = rows.map((r) => ({
      ...r,
      username: userMap.get(r.user_id)?.username || null,
      full_name: userMap.get(r.user_id)?.full_name || null,
      target_name: targetMap.get(`${r.target_type}_${r.target_id}`) || `Unknown ${r.target_type}`,
    }));

    return successResponse(res, { feedback });
  } catch (err) { next(err); }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { target_type, target_id, booking_id, rating, review_text } = req.body;

    const dup = await Feedback.findOne({
      user_id: req.user.user_id,
      target_type,
      target_id: Number(target_id),
    }, { feedback_id: 1 }).lean();
    if (dup) return errorResponse(res, 'You have already submitted feedback for this item.', 409);

    const validTarget = await ensureTargetExists(target_type, Number(target_id));
    if (!validTarget) return errorResponse(res, 'Target not found.', 404);

    if (booking_id) {
      const booking = await Booking.findOne(
        { booking_id: Number(booking_id), user_id: req.user.user_id },
        { booking_status: 1 }
      ).lean();
      if (!booking) return errorResponse(res, 'Booking not found.', 404);
      if (!['Confirmed', 'Completed'].includes(booking.booking_status)) {
        return errorResponse(res, 'Feedback can only be submitted for confirmed or completed bookings.', 409);
      }
    }

    const feedback_id = await getNextNumericId(Feedback, 'feedback_id');
    const sentiment = classifySentiment(review_text || '');

    await Feedback.create({
      feedback_id,
      user_id: req.user.user_id,
      target_type,
      target_id: Number(target_id),
      booking_id: booking_id ? Number(booking_id) : null,
      rating: Number(rating),
      review_text: review_text || null,
      sentiment,
      is_flagged: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await syncTargetRatings(target_type, Number(target_id));

    return successResponse(res, {
      feedback_id,
      sentiment,
    }, 'Feedback submitted.', 201);
  } catch (err) { next(err); }
};

exports.getFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid feedback ID.', 400);
    const row = await Feedback.findOne({ feedback_id: id }).lean();
    if (!row) return errorResponse(res, 'Feedback not found.', 404);

    const user = row.user_id
      ? await User.findOne({ user_id: row.user_id }, { user_id: 1, username: 1, full_name: 1 }).lean()
      : null;

    return successResponse(res, {
      ...row,
      username: user?.username || null,
      full_name: user?.full_name || null,
    });
  } catch (err) { next(err); }
};

exports.updateFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid feedback ID.', 400);
    const existing = await Feedback.findOne({ feedback_id: id }).lean();
    if (!existing) return errorResponse(res, 'Feedback not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && existing.user_id !== req.user.user_id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    const updates = {};
    if (req.body.rating !== undefined) updates.rating = Number(req.body.rating);
    if (req.body.review_text !== undefined) {
      updates.review_text = req.body.review_text || null;
      updates.sentiment = classifySentiment(req.body.review_text || '');
    }
    updates.updated_at = new Date();

    await Feedback.updateOne({ feedback_id: id }, { $set: updates });
    await syncTargetRatings(existing.target_type, Number(existing.target_id));

    return successResponse(res, {}, 'Feedback updated.');
  } catch (err) { next(err); }
};

exports.deleteFeedback = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 'Invalid feedback ID.', 400);
    const row = await Feedback.findOne({ feedback_id: id }).lean();
    if (!row) return errorResponse(res, 'Feedback not found.', 404);

    const isAdmin = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY].includes(req.user.role);
    if (!isAdmin && row.user_id !== req.user.user_id) {
      return errorResponse(res, 'Access denied.', 403);
    }

    await Feedback.deleteOne({ feedback_id: id });
    await syncTargetRatings(row.target_type, Number(row.target_id));

    return successResponse(res, {}, 'Feedback deleted.');
  } catch (err) { next(err); }
};

exports.flagFeedback = async (req, res, next) => {
  try {
    await Feedback.updateOne(
      { feedback_id: Number(req.params.id) },
      { $set: { is_flagged: 1, updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Feedback flagged.');
  } catch (err) { next(err); }
};

exports.getFeedbackSummary = async (req, res, next) => {
  try {
    const targetType = req.params.targetType;
    const targetId = Number(req.params.targetId);

    const rows = await Feedback.find({ target_type: targetType, target_id: targetId })
      .sort({ created_at: -1 })
      .lean();

    const total = rows.length;
    const sum = rows.reduce((s, r) => s + Number(r.rating || 0), 0);

    const summary = {
      target_type: targetType,
      target_id: targetId,
      total_reviews: total,
      average_rating: total ? Number((sum / total).toFixed(2)) : 0,
      positive_count: rows.filter((r) => r.sentiment === 'Positive').length,
      neutral_count: rows.filter((r) => r.sentiment === 'Neutral').length,
      negative_count: rows.filter((r) => r.sentiment === 'Negative').length,
    };

    const recentRows = rows.slice(0, 5);
    const userIds = [...new Set(recentRows.map((r) => r.user_id).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ user_id: { $in: userIds } }, { user_id: 1, username: 1 }).lean()
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u.username]));

    const recent_reviews = recentRows.map((r) => ({
      ...r,
      username: userMap.get(r.user_id) || null,
    }));

    return successResponse(res, { summary, recent_reviews });
  } catch (err) { next(err); }
};

async function ensureTargetExists(targetType, targetId) {
  if (targetType === 'Attraction') {
    const row = await Attraction.findOne({ attraction_id: targetId }, { attraction_id: 1 }).lean();
    return !!row;
  }
  if (targetType === 'Package') {
    const row = await Package.findOne({ package_id: targetId }, { package_id: 1 }).lean();
    return !!row;
  }
  if (targetType === 'Provider') {
    const row = await ServiceProvider.findOne({ provider_id: targetId }, { provider_id: 1 }).lean();
    return !!row;
  }
  if (targetType === 'Schedule') {
    const row = await Schedule.findOne({ schedule_id: targetId }, { schedule_id: 1 }).lean();
    return !!row;
  }
  if (targetType === 'Vehicle') {
    const row = await TransportVehicle.findOne({ vehicle_id: targetId }, { vehicle_id: 1 }).lean();
    return !!row;
  }
  return true;
}

async function syncTargetRatings(targetType, targetId) {
  const agg = await Feedback.aggregate([
    { $match: { target_type: targetType, target_id: targetId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);

  const average_rating = agg[0]?.avg ? Number(agg[0].avg.toFixed(2)) : 0;
  const rating_count = agg[0]?.cnt || 0;

  if (targetType === 'Attraction') {
    await Attraction.updateOne({ attraction_id: targetId }, { $set: { average_rating, rating_count, updated_at: new Date() } });
  } else if (targetType === 'Package') {
    await Package.updateOne({ package_id: targetId }, { $set: { average_rating, rating_count, updated_at: new Date() } });
  } else if (targetType === 'Provider') {
    await ServiceProvider.updateOne({ provider_id: targetId }, { $set: { average_rating, rating_count, updated_at: new Date() } });
  }
}

// POST /api/v1/feedback/:id/respond — Admin responds to a feedback
exports.respondToFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const feedback_id = Number(req.params.id);
    const { response_text } = req.body;

    const fb = await Feedback.findOne({ feedback_id }).lean();
    if (!fb) return errorResponse(res, 'Feedback not found.', 404);

    await Feedback.updateOne(
      { feedback_id },
      { $set: { 
        admin_response: response_text, 
        admin_responder_id: req.user.user_id,
        response_date: new Date(),
        updated_at: new Date() 
      } }
    );

    return successResponse(res, {}, 'Response added to feedback.');
  } catch (err) { next(err); }
};

// GET /api/v1/feedback/best-services — top rated by category
exports.getBestServices = async (req, res, next) => {
  try {
    const targetTypes = ['Attraction', 'Package', 'Provider'];
    const results = {};

    for (const targetType of targetTypes) {
      const agg = await Feedback.aggregate([
        { $match: { target_type: targetType } },
        { $group: {
          _id: '$target_id',
          avg_rating: { $avg: '$rating' },
          total_reviews: { $sum: 1 },
          positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] } },
        }},
        { $match: { total_reviews: { $gte: 1 } } },
        { $sort: { avg_rating: -1, total_reviews: -1 } },
        { $limit: 5 },
      ]);

      // Enrich with names
      const ids = agg.map(a => a._id);
      let nameMap = new Map();

      if (targetType === 'Attraction' && ids.length) {
        const items = await Attraction.find({ attraction_id: { $in: ids } }, { attraction_id: 1, name: 1 }).lean();
        nameMap = new Map(items.map(i => [i.attraction_id, i.name]));
      } else if (targetType === 'Package' && ids.length) {
        const items = await Package.find({ package_id: { $in: ids } }, { package_id: 1, title: 1 }).lean();
        nameMap = new Map(items.map(i => [i.package_id, i.title]));
      } else if (targetType === 'Provider' && ids.length) {
        const items = await ServiceProvider.find({ provider_id: { $in: ids } }, { provider_id: 1, business_name: 1 }).lean();
        nameMap = new Map(items.map(i => [i.provider_id, i.business_name]));
      }

      results[targetType.toLowerCase() + 's'] = agg.map(a => ({
        id: a._id,
        name: nameMap.get(a._id) || `${targetType} #${a._id}`,
        avg_rating: Number(a.avg_rating.toFixed(2)),
        total_reviews: a.total_reviews,
        positive_pct: a.total_reviews ? Math.round((a.positive / a.total_reviews) * 100) : 0,
      }));
    }

    // Overall stats
    const totalFeedback = await Feedback.countDocuments();
    const avgAll = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, pos: { $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] } } } }
    ]);

    results.overview = {
      total_feedback: totalFeedback,
      overall_avg_rating: avgAll[0]?.avg ? Number(avgAll[0].avg.toFixed(2)) : 0,
      positive_rate: totalFeedback ? Math.round(((avgAll[0]?.pos || 0) / totalFeedback) * 100) : 0,
    };

    return successResponse(res, results);
  } catch (err) { next(err); }
};

