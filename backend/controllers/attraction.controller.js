// controllers/attraction.controller.js
// Module 1 (Mongo): Tourism Content Management
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const {
  Attraction,
  AttractionImage,
  SeasonalAvailability,
  AttractionAnalytics,
} = require('../models');

const ACTIVE_FILTER = { $in: [1, true, '1'] };

// GET /api/v1/attractions
exports.listAttractions = async (req, res, next) => {
  try {
    const { category, city, status, season, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { is_active: ACTIVE_FILTER };
    if (search) where.name = { $regex: search, $options: 'i' };
    if (category) where.category = category;
    if (city) where.city = { $regex: city, $options: 'i' };
    if (status) where.operational_status = status;

    if (season) {
      const seasonRows = await SeasonalAvailability.find({ season }, { attraction_id: 1 }).lean();
      const ids = seasonRows.map((s) => s.attraction_id);
      where.attraction_id = { $in: ids.length ? ids : [-1] };
    }

    const [rowsBase, total] = await Promise.all([
      Attraction.find(where)
        .sort({ average_rating: -1, created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Attraction.countDocuments(where),
    ]);

    const ids = rowsBase.map((a) => a.attraction_id);
    const imgs = ids.length
      ? await AttractionImage.find({ attraction_id: { $in: ids } }, { attraction_id: 1, image_url: 1, is_primary: 1 }).lean()
      : [];

    const imgMap = new Map();
    for (const i of imgs) {
      if (!imgMap.has(i.attraction_id)) imgMap.set(i.attraction_id, []);
      imgMap.get(i.attraction_id).push(i);
    }

    const rows = rowsBase.map((a) => {
      const arr = (imgMap.get(a.attraction_id) || [])
        .sort((x, y) => Number(y.is_primary || 0) - Number(x.is_primary || 0))
        .map((x) => x.image_url);
      return { ...a, images: arr.join(',') };
    });

    return successResponse(res, {
      attractions: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (err) { next(err); }
};

// GET /api/v1/attractions/:id
exports.getAttraction = async (req, res, next) => {
  try {
    const attractionId = Number(req.params.id);
    const row = await Attraction.findOne({ attraction_id: attractionId, is_active: ACTIVE_FILTER }).lean();
    if (!row) return errorResponse(res, 'Attraction not found.', 404);

    const [images, seasons] = await Promise.all([
      AttractionImage.find(
        { attraction_id: attractionId },
        { image_id: 1, image_url: 1, caption: 1, is_primary: 1 }
      ).sort({ is_primary: -1 }).lean(),
      SeasonalAvailability.find(
        { attraction_id: attractionId },
        { season: 1, start_month: 1, end_month: 1, notes: 1 }
      ).lean(),
    ]);

    return successResponse(res, {
      ...row,
      images: images.map((im) => ({ ...im, url: im.image_url })),
      seasonal_info: seasons,
    });
  } catch (err) { next(err); }
};

// POST /api/v1/attractions
exports.createAttraction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      name, description, category, address, city, latitude, longitude,
      entrance_fee = 0, operational_status = 'Open', opening_time, closing_time,
      image_url,
    } = req.body;

    const attraction_id = await getNextNumericId(Attraction, 'attraction_id');
    await Attraction.create({
      attraction_id,
      name,
      description,
      category,
      address,
      city,
      latitude,
      longitude,
      entrance_fee,
      operational_status,
      image_url,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      average_rating: 0,
      rating_count: 0,
      monthly_visitors: 0,
      yearly_visitors: 0,
      created_by: req.user.user_id,
      is_active: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return successResponse(res, { attraction_id }, 'Attraction created.', 201);
  } catch (err) { next(err); }
};

// PUT /api/v1/attractions/:id
exports.updateAttraction = async (req, res, next) => {
  try {
    const fields = [
      'name', 'description', 'category', 'address', 'city', 'latitude', 'longitude',
      'entrance_fee', 'operational_status', 'opening_time', 'closing_time', 'image_url',
    ];
    const patch = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    patch.updated_at = new Date();

    await Attraction.updateOne({ attraction_id: Number(req.params.id) }, { $set: patch });
    return successResponse(res, {}, 'Attraction updated.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/attractions/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    await Attraction.updateOne(
      { attraction_id: Number(req.params.id) },
      { $set: { operational_status: req.body.operational_status, updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Status updated.');
  } catch (err) { next(err); }
};

// DELETE /api/v1/attractions/:id (soft delete)
exports.deleteAttraction = async (req, res, next) => {
  try {
    await Attraction.updateOne(
      { attraction_id: Number(req.params.id) },
      { $set: { is_active: 0, updated_at: new Date() } }
    );
    return successResponse(res, {}, 'Attraction deactivated.');
  } catch (err) { next(err); }
};

// POST /api/v1/attractions/:id/images
exports.addImage = async (req, res, next) => {
  try {
    const { image_url, caption, is_primary = false } = req.body;
    if (!image_url) return errorResponse(res, 'image_url is required.', 400);

    const attraction_id = Number(req.params.id);
    if (is_primary) {
      await AttractionImage.updateMany({ attraction_id }, { $set: { is_primary: 0 } });
    }

    const image_id = await getNextNumericId(AttractionImage, 'image_id');
    await AttractionImage.create({
      image_id,
      attraction_id,
      image_url,
      caption: caption || null,
      is_primary: is_primary ? 1 : 0,
      created_at: new Date(),
    });

    return successResponse(res, { image_id }, 'Image added.', 201);
  } catch (err) { next(err); }
};

// POST /api/v1/attractions/:id/seasonal-availability
exports.setSeasonalAvailability = async (req, res, next) => {
  try {
    const { season, start_month, end_month, notes } = req.body;
    const availability_id = await getNextNumericId(SeasonalAvailability, 'availability_id');

    await SeasonalAvailability.create({
      availability_id,
      attraction_id: Number(req.params.id),
      season,
      start_month,
      end_month,
      notes: notes || null,
    });

    return successResponse(res, { availability_id }, 'Seasonal availability set.', 201);
  } catch (err) { next(err); }
};

// GET /api/v1/attractions/recommendations?month=&category=&limit=
exports.getSeasonalRecommendations = async (req, res, next) => {
  try {
    const currentMonth = req.query.month ? Number(req.query.month) : (new Date().getMonth() + 1);
    const { limit = 8, category } = req.query;

    const seasonalRows = await SeasonalAvailability.find({
      start_month: { $lte: currentMonth },
      end_month: { $gte: currentMonth },
    }, { attraction_id: 1, season: 1, notes: 1 }).lean();

    const ids = [...new Set(seasonalRows.map((s) => s.attraction_id))];
    let where = { is_active: ACTIVE_FILTER, operational_status: { $in: ['Open', 'Seasonal'] }, attraction_id: { $in: ids.length ? ids : [-1] } };
    if (category) where = { ...where, category };

    const rowsBase = await Attraction.find(where)
      .sort({ average_rating: -1 })
      .limit(Number(limit))
      .lean();

    const idSet = rowsBase.map((a) => a.attraction_id);
    const imageRows = idSet.length
      ? await AttractionImage.find({ attraction_id: { $in: idSet }, is_primary: 1 }, { attraction_id: 1, image_url: 1 }).lean()
      : [];
    const imageMap = new Map(imageRows.map((i) => [i.attraction_id, i.image_url]));

    const seasonMap = new Map();
    for (const s of seasonalRows) {
      if (!seasonMap.has(s.attraction_id)) seasonMap.set(s.attraction_id, s);
    }

    const recommendations = rowsBase.map((a) => ({
      attraction_id: a.attraction_id,
      name: a.name,
      category: a.category,
      city: a.city,
      entrance_fee: a.entrance_fee,
      operational_status: a.operational_status,
      average_rating: a.average_rating,
      rating_count: a.rating_count,
      description: a.description,
      season: seasonMap.get(a.attraction_id)?.season || null,
      season_notes: seasonMap.get(a.attraction_id)?.notes || null,
      primary_image: imageMap.get(a.attraction_id) || null,
    }));

    return successResponse(res, {
      recommendations,
      current_month: currentMonth,
      month_name: new Date(2000, currentMonth - 1).toLocaleString('en', { month: 'long' }),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/attractions/analytics/report
exports.getAnalyticsReport = async (req, res, next) => {
  try {
    const { User, Booking, Feedback } = require('../models');

    // Calculate real totals
    const totalTourists = await User.countDocuments({ role: 'Tourist' });
    
    const revenueAgg = await Booking.aggregate([
      { $match: { booking_status: { $in: ['Confirmed', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const ratingAgg = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 0;

    const totals = {
      total_visitors: totalTourists,
      total_revenue: totalRevenue,
      avg_rating: avgRating,
    };

    // Calculate category breakdown from active attractions
    const activeAttractions = await Attraction.find({ is_active: ACTIVE_FILTER }).lean();
    
    const catMap = new Map();
    for (const a of activeAttractions) {
      if (!catMap.has(a.category)) {
        catMap.set(a.category, {
          category: a.category,
          attraction_count: 0,
          total_visitors: 0, // We'll just map rating_count to visitors here as a proxy for engagement
          _ratings: [],
        });
      }
      const c = catMap.get(a.category);
      c.attraction_count += 1;
      c.total_visitors += (a.rating_count || 0) * 5; // Fake a visitor count based on reviews
      if (a.average_rating) {
        c._ratings.push(Number(a.average_rating));
      }
    }
    
    const category_breakdown = [...catMap.values()]
      .map((x) => ({
        category: x.category,
        attraction_count: x.attraction_count,
        total_visitors: x.total_visitors,
        avg_rating: x._ratings.length ? Number((x._ratings.reduce((s, r) => s + r, 0) / x._ratings.length).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.attraction_count - a.attraction_count);

    return successResponse(res, {
      totals,
      category_breakdown,
    });
  } catch (err) { next(err); }
};

// POST /api/v1/attractions/auto-status
exports.bulkAutoUpdateStatus = async (req, res, next) => {
  try {
    const { rules } = req.body;
    let updated = 0;

    if (Array.isArray(rules) && rules.length > 0) {
      for (const rule of rules) {
        if (rule.attraction_id && rule.operational_status) {
          const res = await Attraction.updateOne(
            { attraction_id: Number(rule.attraction_id) },
            { $set: { operational_status: rule.operational_status, updated_at: new Date() } }
          );
          updated += Number(res.modifiedCount || 0);
        }
      }
    } else {
      const currentMonth = new Date().getMonth() + 1;
      const seasonal = await SeasonalAvailability.find({
        start_month: { $lte: currentMonth },
        end_month: { $gte: currentMonth },
      }, { attraction_id: 1 }).lean();

      const ids = seasonal.map((s) => s.attraction_id);
      if (ids.length > 0) {
        const res2 = await Attraction.updateMany(
          { attraction_id: { $in: ids }, operational_status: 'Open' },
          { $set: { operational_status: 'Seasonal', updated_at: new Date() } }
        );
        updated = Number(res2.modifiedCount || 0);
      }
    }

    return successResponse(res, { updated }, `${updated} attraction status(es) updated.`);
  } catch (err) { next(err); }
};

// GET /api/v1/attractions/:id/analytics
exports.getAttractionAnalytics = async (req, res, next) => {
  try {
    const attraction_id = Number(req.params.id);
    const rows = await AttractionAnalytics.find({ attraction_id }).lean();

    const monthly = [...rows]
      .sort((a, b) => (b.year - a.year) || (b.month - a.month))
      .slice(0, 24)
      .map((r) => ({
        year: r.year,
        month: r.month,
        visitor_count: r.visitor_count,
        booking_count: r.booking_count,
        revenue: r.revenue,
        avg_rating: r.avg_rating,
      }));

    const yearMap = new Map();
    for (const r of rows) {
      if (!yearMap.has(r.year)) {
        yearMap.set(r.year, {
          year: r.year,
          total_visitors: 0,
          total_bookings: 0,
          total_revenue: 0,
          ratings: [],
        });
      }
      const y = yearMap.get(r.year);
      y.total_visitors += Number(r.visitor_count || 0);
      y.total_bookings += Number(r.booking_count || 0);
      y.total_revenue += Number(r.revenue || 0);
      y.ratings.push(Number(r.avg_rating || 0));
    }

    const yearly = [...yearMap.values()]
      .map((y) => ({
        year: y.year,
        total_visitors: y.total_visitors,
        total_bookings: y.total_bookings,
        total_revenue: y.total_revenue,
        avg_rating: y.ratings.length ? y.ratings.reduce((s, x) => s + x, 0) / y.ratings.length : 0,
      }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);

    return successResponse(res, { monthly, yearly });
  } catch (err) { next(err); }
};
