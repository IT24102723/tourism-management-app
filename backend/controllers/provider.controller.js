// controllers/provider.controller.js
// Module 5 (Mongo): Service Provider Management
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const {
  ServiceProvider,
  User,
  Package,
  Feedback,
  TransportVehicle,
} = require('../models');

const RATING_HIDE_THRESHOLD = 2.5;

function isActiveFromStatus(status) {
  return status === 'Active' ? 1 : 0;
}

function buildPublicProviderVisibilityWhere() {
  return {
    $and: [
      {
        $or: [
          { status: 'Active' },
          { status: 'verified' },
          { status: 'Pending' },
          { status: { $exists: false } },
          { status: null },
          { status: '' },
        ],
      },
      {
        $or: [
          { is_active: { $exists: false } },
          { is_active: true },
          { is_active: 1 },
        ],
      },
    ],
  };
}

exports.getMyProvider = async (req, res, next) => {
  try {
    const provider = await ServiceProvider.findOne({ user_id: req.user.user_id }).lean();
    if (!provider) return errorResponse(res, 'No provider profile found.', 404);

    const owner = await User.findOne({ user_id: provider.user_id }, { email: 1 }).lean();
    return successResponse(res, { ...provider, owner_email: owner?.email || null });
  } catch (err) { next(err); }
};

exports.listProviders = async (req, res, next) => {
  try {
    const { type, city, min_rating = 0, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = buildPublicProviderVisibilityWhere();
    if (type) where.business_type = type;
    if (city) where.city = { $regex: city, $options: 'i' };
    if (Number(min_rating) > 0) where.average_rating = { $gte: Number(min_rating) };

    const [rows, total] = await Promise.all([
      ServiceProvider.find(where).sort({ average_rating: -1, created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
      ServiceProvider.countDocuments(where),
    ]);

    const ownerIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const owners = ownerIds.length
      ? await User.find({ user_id: { $in: ownerIds } }, { user_id: 1, email: 1 }).lean()
      : [];
    const ownerMap = new Map(owners.map((u) => [u.user_id, u]));

    const providers = rows.map((r) => ({ ...r, owner_email: ownerMap.get(r.user_id)?.email || null }));
    return successResponse(res, {
      providers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (err) { next(err); }
};

exports.listAllProviders = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (type) where.business_type = type;

    const rows = await ServiceProvider.find(where).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean();

    const ownerIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const owners = ownerIds.length
      ? await User.find({ user_id: { $in: ownerIds } }, { user_id: 1, email: 1, username: 1, full_name: 1 }).lean()
      : [];
    const ownerMap = new Map(owners.map((u) => [u.user_id, u]));

    const providers = rows.map((r) => ({
      ...r,
      owner_email: ownerMap.get(r.user_id)?.email || null,
      username: ownerMap.get(r.user_id)?.username || null,
      owner_name: ownerMap.get(r.user_id)?.full_name || null,
    }));

    const statusCounts = await ServiceProvider.aggregate([
      { $group: { _id: '$status', cnt: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', cnt: 1 } },
    ]);

    return successResponse(res, {
      providers,
      counts: statusCounts,
      pagination: { page: Number(page), limit: Number(limit) },
    });
  } catch (err) { next(err); }
};

exports.getProvider = async (req, res, next) => {
  try {
    const provider = await ServiceProvider.findOne({ provider_id: Number(req.params.id) }).lean();
    if (!provider) return errorResponse(res, 'Provider not found.', 404);

    const owner = await User.findOne(
      { user_id: provider.user_id },
      { email: 1, phone: 1 }
    ).lean();

    const isAdmin = req.user && ['Admin', 'Tourism_Authority'].includes(req.user.role);
    const isOwner = req.user && req.user.user_id === provider.user_id;

    const statusMissing = provider.status === undefined || provider.status === null || provider.status === '';
    const isPubliclyVisible = provider.status === 'Active' || (statusMissing && [1, true, undefined].includes(provider.is_active));

    if (!isAdmin && !isOwner && !isPubliclyVisible) {
      return errorResponse(res, 'This provider is not currently available.', 403);
    }

    return successResponse(res, {
      ...provider,
      owner_email: owner?.email || null,
      owner_phone: owner?.phone || null,
    });
  } catch (err) { next(err); }
};

exports.createProvider = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      business_name, business_type, description, address, city,
      latitude, longitude, contact_email, contact_phone, website, license_number, image_url
    } = req.body;

    const existing = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
    if (existing) return errorResponse(res, 'A provider profile already exists for this account.', 409);

    if (!business_name || !business_type) {
      return errorResponse(res, 'business_name and business_type are required.', 422);
    }

    const provider_id = await getNextNumericId(ServiceProvider, 'provider_id');
    const isAdmin = ['Admin', 'Tourism_Authority'].includes(req.user.role);
    const initialStatus = (isAdmin && req.body.status) ? req.body.status : 'Pending';
    const is_active = isActiveFromStatus(initialStatus);

    await ServiceProvider.create({
      provider_id,
      user_id: req.user.user_id,
      business_name,
      business_type,
      description: description || null,
      address: address || null,
      city: city || null,
      latitude: latitude || null,
      longitude: longitude || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      website: website || null,
      license_number: license_number || null,
      image_url: image_url || null,
      status: initialStatus,
      is_active: is_active,
      is_verified: isAdmin ? 1 : 0,
      average_rating: 0,
      rating_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return successResponse(
      res,
      { provider_id },
      'Provider registration submitted. Awaiting admin approval.',
      201
    );
  } catch (err) { next(err); }
};

exports.updateProvider = async (req, res, next) => {
  try {
    const update = {};
    const allowed = [
      'business_name', 'business_type', 'description', 'address', 'city',
      'contact_email', 'contact_phone', 'website', 'license_number', 'image_url'
    ];
    for (const f of allowed) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }
    update.updated_at = new Date();

    await ServiceProvider.updateOne({ provider_id: Number(req.params.id) }, { $set: update });
    return successResponse(res, {}, 'Provider updated.');
  } catch (err) { next(err); }
};

exports.approveProvider = async (req, res, next) => {
  try {
    const provider = await ServiceProvider.findOne({ provider_id: Number(req.params.id) }, { status: 1 }).lean();
    if (!provider) return errorResponse(res, 'Provider not found.', 404);
    if (provider.status !== 'Pending') {
      return errorResponse(res, `Provider is already ${provider.status}.`, 409);
    }

    await ServiceProvider.updateOne(
      { provider_id: Number(req.params.id) },
      { $set: { status: 'Active', is_verified: 1, is_active: 1, updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Provider approved and set to Active.');
  } catch (err) { next(err); }
};

exports.updateProviderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Active', 'Inactive', 'Suspended'];
    if (!allowed.includes(status)) {
      return errorResponse(res, `status must be one of: ${allowed.join(', ')}`, 422);
    }

    await ServiceProvider.updateOne(
      { provider_id: Number(req.params.id) },
      { $set: { status, is_active: isActiveFromStatus(status), updated_at: new Date() } }
    );

    if (status !== 'Active') {
      await Package.updateMany({ provider_id: Number(req.params.id), is_active: 1 }, { $set: { is_active: 0, updated_at: new Date() } });
    }

    return successResponse(res, {}, `Provider status updated to ${status}.`);
  } catch (err) { next(err); }
};

exports.verifyProvider = async (req, res, next) => {
  try {
    await ServiceProvider.updateOne(
      { provider_id: Number(req.params.id) },
      { $set: { is_verified: 1, updated_at: new Date() } }
    );
    return successResponse(res, {}, 'Provider verified.');
  } catch (err) { next(err); }
};

exports.deleteProvider = async (req, res, next) => {
  try {
    // Hard delete: remove provider and related packages
    await ServiceProvider.deleteOne({ provider_id: Number(req.params.id) });
    await Package.deleteMany({ provider_id: Number(req.params.id) });
    return successResponse(res, {}, 'Provider deleted.');
  } catch (err) { next(err); }
};

exports.checkAndHideProvider = async (provider_id) => {
  const provider = await ServiceProvider.findOne({ provider_id: Number(provider_id) }, { average_rating: 1, status: 1 }).lean();
  if (!provider) return;

  if (provider.status === 'Active' && Number(provider.average_rating || 0) < RATING_HIDE_THRESHOLD) {
    await ServiceProvider.updateOne(
      { provider_id: Number(provider_id) },
      { $set: { status: 'Suspended', is_active: 0, updated_at: new Date() } }
    );
  }
};

exports.getProviderRankings = async (req, res, next) => {
  try {
    const { type, min_rating = 0, sort = 'rating', limit = 50 } = req.query;
    const minRating = Number(min_rating) || 0;

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const where = buildPublicProviderVisibilityWhere();
    if (type) where.business_type = type;

    const providers = await ServiceProvider.find(where).lean();
    const providerIds = providers.map((p) => p.provider_id);

    const [feedbackAgg, pkgAgg] = await Promise.all([
      providerIds.length
        ? Feedback.aggregate([
            { $match: { target_type: 'Provider', target_id: { $in: providerIds } } },
            {
              $group: {
                _id: '$target_id',
                avg_rating: { $avg: '$rating' },
                review_count: { $sum: 1 },
                positive_count: { $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] } },
                neutral_count: { $sum: { $cond: [{ $eq: ['$sentiment', 'Neutral'] }, 1, 0] } },
                negative_count: { $sum: { $cond: [{ $eq: ['$sentiment', 'Negative'] }, 1, 0] } },
                star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
              },
            },
          ])
        : [],
      providerIds.length
        ? Package.aggregate([
            { $match: { provider_id: { $in: providerIds }, is_active: 1 } },
            { $group: { _id: '$provider_id', active_packages: { $sum: 1 } } },
          ])
        : [],
    ]);

    const feedbackMap = new Map(feedbackAgg.map((f) => [f._id, f]));
    const pkgMap = new Map(pkgAgg.map((p) => [p._id, p.active_packages]));

    let rows = providers.map((sp) => {
      const f = feedbackMap.get(sp.provider_id) || {};
      const aggRating = Number(f.avg_rating || 0);
      const aggCount = Number(f.review_count || 0);
      const average_rating = aggCount > 0 ? Number(aggRating.toFixed(2)) : Number(sp.average_rating || 0);
      const rating_count = aggCount > 0 ? aggCount : Number(sp.rating_count || 0);
      return {
        provider_id: sp.provider_id,
        business_name: sp.business_name,
        business_type: sp.business_type,
        city: sp.city,
        description: sp.description,
        contact_email: sp.contact_email,
        contact_phone: sp.contact_phone,
        website: sp.website,
        average_rating,
        rating_count,
        is_verified: Number(sp.is_verified || 0),
        created_at: sp.created_at,
        positive_count: Number(f.positive_count || 0),
        neutral_count: Number(f.neutral_count || 0),
        negative_count: Number(f.negative_count || 0),
        star5: Number(f.star5 || 0),
        star4: Number(f.star4 || 0),
        star3: Number(f.star3 || 0),
        star2: Number(f.star2 || 0),
        star1: Number(f.star1 || 0),
        active_packages: Number(pkgMap.get(sp.provider_id) || 0),
      };
    });

    if (minRating > 0) {
      rows = rows.filter((r) => Number(r.average_rating || 0) >= minRating);
    }

    if (sort === 'reviews') {
      rows.sort((a, b) => (b.rating_count - a.rating_count) || (b.average_rating - a.average_rating));
    } else if (sort === 'name') {
      rows.sort((a, b) => String(a.business_name || '').localeCompare(String(b.business_name || '')));
    } else {
      rows.sort((a, b) => (b.average_rating - a.average_rating) || (b.rating_count - a.rating_count));
    }

    rows = rows.slice(0, Number(limit));
    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return successResponse(res, { rankings: ranked });
  } catch (err) { next(err); }
};

exports.getMyStats = async (req, res, next) => {
  try {
    const sp = await ServiceProvider.findOne(
      { user_id: req.user.user_id },
      { provider_id: 1, average_rating: 1, rating_count: 1, status: 1 }
    ).lean();

    if (!sp) return errorResponse(res, 'Provider profile not found.', 404);

    const provider_id = sp.provider_id;

    const [pkgRows, vehicles] = await Promise.all([
      Package.find({ provider_id }, { is_active: 1, current_bookings: 1 }).lean(),
      TransportVehicle.countDocuments({ provider_id }),
    ]);

    const total_packages = pkgRows.length;
    const active_packages = pkgRows.filter((p) => Number(p.is_active) === 1).length;
    const total_bookings = pkgRows.reduce((s, p) => s + Number(p.current_bookings || 0), 0);

    return successResponse(res, {
      provider_id,
      status: sp.status,
      active_packages,
      total_packages,
      total_bookings,
      vehicles: Number(vehicles || 0),
      average_rating: sp.average_rating ? parseFloat(Number(sp.average_rating).toFixed(1)) : null,
      rating_count: Number(sp.rating_count || 0),
    });
  } catch (err) { next(err); }
};
