// controllers/package.controller.js
// Module 2 (Mongo): Tour Package Planning
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const {
  Package,
  ServiceProvider,
  User,
  PackageAttraction,
  Attraction,
  SeasonalAvailability,
  TransportVehicle,
} = require('../models');

const ACTIVE_FILTER = { $in: [1, true, '1'] };
const INACTIVE_FILTER = { $in: [0, false, '0'] };

// GET /api/v1/packages
exports.listPackages = async (req, res, next) => {
  try {
    const { type, min_price, max_price, days, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const activeProviders = await ServiceProvider.find(
      {
        $or: [
          { status: 'Active' },
          { status: 'Pending' },
          { status: 'verified' },
          { is_active: ACTIVE_FILTER },
        ],
      },
      { provider_id: 1 }
    ).lean();
    const activeIds = activeProviders.map((p) => p.provider_id);

    const where = { is_active: ACTIVE_FILTER };
    
    // Always restrict to packages that either have NO provider, 
    // or belong to a provider that is active.
    where.$or = [
      { provider_id: null },
      { provider_id: { $exists: false } },
    ];
    if (activeIds.length > 0) {
      where.$or.push({ provider_id: { $in: activeIds } });
    }

    if (type) where.package_type = type;
    if (min_price) where.price_per_person = { ...(where.price_per_person || {}), $gte: Number(min_price) };
    if (max_price) where.price_per_person = { ...(where.price_per_person || {}), $lte: Number(max_price) };
    if (days) where.duration_days = Number(days);

    const [rowsBase, total] = await Promise.all([
      Package.find(where).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
      Package.countDocuments(where),
    ]);

    const providerIds = [...new Set(rowsBase.map((p) => p.provider_id).filter(Boolean))];
    const providers = providerIds.length
      ? await ServiceProvider.find({ provider_id: { $in: providerIds } }, { provider_id: 1, business_name: 1 }).lean()
      : [];
    const providerMap = new Map(providers.map((p) => [p.provider_id, p.business_name]));

    const rows = rowsBase.map((p) => ({ ...p, provider_name: providerMap.get(p.provider_id) || null }));

    return successResponse(res, {
      packages: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (err) { next(err); }
};

// GET /api/v1/packages/:id
exports.getPackage = async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ package_id: Number(req.params.id), is_active: ACTIVE_FILTER }).lean();
    if (!pkg) return errorResponse(res, 'Package not found.', 404);

    const items = await PackageAttraction.find({ package_id: Number(req.params.id) }).sort({ visit_day: 1, visit_order: 1 }).lean();
    const attrIds = [...new Set(items.map((i) => i.attraction_id).filter(Boolean))];
    const attrs = attrIds.length
      ? await Attraction.find({ attraction_id: { $in: attrIds } }, { attraction_id: 1, name: 1, category: 1, city: 1, entry_fee: 1, operational_status: 1 }).lean()
      : [];
    const attrMap = new Map(attrs.map((a) => [a.attraction_id, a]));

    const itinerary = items.map((i) => ({ ...i, ...(attrMap.get(i.attraction_id) || {}) }));
    return successResponse(res, { ...pkg, itinerary });
  } catch (err) { next(err); }
};

// POST /api/v1/packages
exports.createPackage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { 
      title, description, provider_id, duration_days, 
      price_per_person, max_capacity, package_type = 'Standard',
      image_url 
    } = req.body;

    let finalProviderId = provider_id || null;

    // Automatically link to provider if the user is a Service Provider
    if (['SERVICE_PROVIDER', 'Service_Provider'].includes(req.user.role)) {
      const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
      if (sp) finalProviderId = sp.provider_id;
    }

    const package_id = await getNextNumericId(Package, 'package_id');

    await Package.create({
      package_id,
      title,
      description,
      provider_id: finalProviderId,
      duration_days,
      price_per_person,
      max_capacity: max_capacity || null,
      current_bookings: 0,
      package_type,
      image_url,
      is_active: 1,
      created_by: req.user.user_id,
      // Sync to legacy fields
      name: title,
      price: price_per_person,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return successResponse(res, { package_id }, 'Package created.', 201);
  } catch (err) { next(err); }
};

// PUT /api/v1/packages/:id
exports.updatePackage = async (req, res, next) => {
  try {
    const pkgExists = await Package.findOne({ package_id: Number(req.params.id) }, { package_id: 1 }).lean();
    if (!pkgExists) return errorResponse(res, 'Package not found.', 404);

    const patch = {};
    const fields = ['title', 'description', 'duration_days', 'price_per_person', 'max_capacity', 'package_type', 'is_active', 'image_url'];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        // Normalize is_active to integer 0/1 to prevent mixed boolean/integer
        // values accumulating from migrated data.
        patch[f] = f === 'is_active' ? (req.body[f] == 1 ? 1 : 0) : req.body[f];
      }
    }
    
    // Sync to legacy fields for backward compatibility
    if (patch.title !== undefined) patch.name = patch.title;
    if (patch.price_per_person !== undefined) patch.price = patch.price_per_person;

    patch.updated_at = new Date();

    await Package.updateOne({ package_id: Number(req.params.id) }, { $set: patch });
    return successResponse(res, {}, 'Package updated.');
  } catch (err) { next(err); }
};

// DELETE /api/v1/packages/:id
exports.deletePackage = async (req, res, next) => {
  try {
    if (['SERVICE_PROVIDER', 'Service_Provider'].includes(req.user.role)) {
      const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
      if (!sp) return errorResponse(res, 'Provider profile not found.', 404);

      const pkg = await Package.findOne({ package_id: Number(req.params.id) }, { provider_id: 1 }).lean();
      if (!pkg) return errorResponse(res, 'Package not found.', 404);
      if (pkg.provider_id !== sp.provider_id) return errorResponse(res, 'Forbidden: not your package.', 403);
    }

    await Package.updateOne({ package_id: Number(req.params.id) }, { $set: { is_active: 0, updated_at: new Date() } });
    return successResponse(res, {}, 'Package deactivated.');
  } catch (err) { next(err); }
};

// GET /api/v1/packages/my
exports.listMyPackages = async (req, res, next) => {
  try {
    const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
    if (!sp) return errorResponse(res, 'Provider profile not found.', 404);

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [rows, total] = await Promise.all([
      Package.find({ provider_id: sp.provider_id }).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
      Package.countDocuments({ provider_id: sp.provider_id }),
    ]);

    return successResponse(res, {
      packages: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (err) { next(err); }
};

// GET /api/v1/packages/all
exports.listAllPackages = async (req, res, next) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (type) where.package_type = type;
    if (status === 'active') where.is_active = ACTIVE_FILTER;
    if (status === 'inactive') where.is_active = INACTIVE_FILTER;
    if (search) where.title = { $regex: search, $options: 'i' };

    const [rowsBase, total] = await Promise.all([
      Package.find(where).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean(),
      Package.countDocuments(where),
    ]);

    const providerIds = [...new Set(rowsBase.map((p) => p.provider_id).filter(Boolean))];
    const creatorIds = [...new Set(rowsBase.map((p) => p.created_by).filter(Boolean))];

    const [providers, creators] = await Promise.all([
      providerIds.length ? ServiceProvider.find({ provider_id: { $in: providerIds } }, { provider_id: 1, business_name: 1 }).lean() : [],
      creatorIds.length ? User.find({ user_id: { $in: creatorIds } }, { user_id: 1, username: 1 }).lean() : [],
    ]);

    const providerMap = new Map(providers.map((p) => [p.provider_id, p.business_name]));
    const creatorMap = new Map(creators.map((u) => [u.user_id, u.username]));

    const rows = rowsBase.map((p) => ({
      ...p,
      provider_name: providerMap.get(p.provider_id) || null,
      created_by_name: creatorMap.get(p.created_by) || null,
    }));

    return successResponse(res, {
      packages: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit) || 1),
      },
    });
  } catch (err) { next(err); }
};

// DELETE /api/v1/packages/:id/hard
exports.hardDeletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ package_id: Number(req.params.id) }, { package_id: 1 }).lean();
    if (!pkg) return errorResponse(res, 'Package not found.', 404);

    await PackageAttraction.deleteMany({ package_id: Number(req.params.id) });
    await Package.deleteOne({ package_id: Number(req.params.id) });
    return successResponse(res, {}, 'Package permanently deleted.');
  } catch (err) { next(err); }
};

// POST /api/v1/packages/:id/attractions
exports.addAttraction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { attraction_id, visit_day, visit_order = 1, duration_hours, notes } = req.body;

    const attr = await Attraction.findOne({ attraction_id: Number(attraction_id), is_active: 1 }, { operational_status: 1 }).lean();
    if (!attr) return errorResponse(res, 'Attraction not found or inactive.', 404);

    const id = await getNextNumericId(PackageAttraction, 'id');
    await PackageAttraction.create({
      id,
      package_id: Number(req.params.id),
      attraction_id: Number(attraction_id),
      visit_day: Number(visit_day),
      visit_order: Number(visit_order),
      duration_hours: duration_hours || null,
      notes: notes || null,
    });

    await _recalculatePackage(Number(req.params.id));
    return successResponse(res, { id }, 'Attraction added to package.', 201);
  } catch (err) { next(err); }
};

// DELETE /api/v1/packages/:id/attractions/:attrId
exports.removeAttraction = async (req, res, next) => {
  try {
    await PackageAttraction.deleteMany({ package_id: Number(req.params.id), attraction_id: Number(req.params.attrId) });
    await _recalculatePackage(Number(req.params.id));
    return successResponse(res, {}, 'Attraction removed from package.');
  } catch (err) { next(err); }
};

// POST /api/v1/packages/:id/auto-select
exports.autoSelectAttractions = async (req, res, next) => {
  try {
    const { categories = [], month, max_per_day = 3 } = req.body;

    const pkg = await Package.findOne({ package_id: Number(req.params.id) }).lean();
    if (!pkg) return errorResponse(res, 'Package not found.', 404);

    const where = { is_active: ACTIVE_FILTER, operational_status: 'Open' };
    if (Array.isArray(categories) && categories.length > 0) where.category = { $in: categories };

    let attractions = await Attraction.find(where).sort({ average_rating: -1 }).limit(Number(pkg.duration_days || 1) * Number(max_per_day)).lean();

    if (month) {
      const seasonal = await SeasonalAvailability.find({ start_month: { $lte: Number(month) }, end_month: { $gte: Number(month) } }, { attraction_id: 1 }).lean();
      const seasonalIds = new Set(seasonal.map((s) => s.attraction_id));
      attractions = attractions.filter((a) => a.operational_status !== 'Seasonal' || seasonalIds.has(a.attraction_id));
    }

    let added = 0;
    for (let i = 0; i < attractions.length; i += 1) {
      const day = Math.floor(i / Number(max_per_day)) + 1;
      const order = (i % Number(max_per_day)) + 1;

      const exists = await PackageAttraction.findOne({
        package_id: Number(req.params.id),
        attraction_id: attractions[i].attraction_id,
        visit_day: day,
      }, { id: 1 }).lean();

      if (!exists) {
        const id = await getNextNumericId(PackageAttraction, 'id');
        await PackageAttraction.create({
          id,
          package_id: Number(req.params.id),
          attraction_id: attractions[i].attraction_id,
          visit_day: day,
          visit_order: order,
        });
        added += 1;
      }
    }

    await _recalculatePackage(Number(req.params.id));
    return successResponse(res, { added }, `Auto-selected ${added} attractions.`);
  } catch (err) { next(err); }
};

async function _recalculatePackage(package_id) {
  const items = await PackageAttraction.find({ package_id }, { visit_day: 1, attraction_id: 1 }).lean();
  if (!items.length) return;

  const maxDay = Math.max(...items.map((i) => Number(i.visit_day || 1)));
  await Package.updateOne(
    { package_id },
    { $set: { duration_days: maxDay, updated_at: new Date() } }
  );
}

// GET /api/v1/packages/:id/cost-estimate
exports.getCostEstimate = async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ package_id: Number(req.params.id), is_active: ACTIVE_FILTER }).lean();
    if (!pkg) return errorResponse(res, 'Package not found.', 404);

    const num_adults = Math.max(1, Number(req.query.num_adults || 1));
    const num_children = Math.max(0, Number(req.query.num_children || 0));
    const totalPax = num_adults + num_children * 0.5;

    const packageCost = parseFloat((Number(pkg.price_per_person || 0) * totalPax).toFixed(2));

    const pa = await PackageAttraction.find({ package_id: Number(req.params.id) }, { attraction_id: 1 }).lean();
    const attrIds = [...new Set(pa.map((x) => x.attraction_id))];
    const attrs = attrIds.length
      ? await Attraction.find({ attraction_id: { $in: attrIds } }, { entry_fee: 1 }).lean()
      : [];
    const totalEntryFee = attrs.reduce((s, a) => s + Number(a.entry_fee || 0), 0);
    const entryFees = parseFloat((totalEntryFee * totalPax).toFixed(2));

    const vehicles = await TransportVehicle.find({ is_available: 1, capacity: { $gte: num_adults + num_children } })
      .sort({ price_per_day: 1 })
      .limit(1)
      .lean();

    const transportCost = vehicles.length > 0
      ? parseFloat((Number(vehicles[0].price_per_day || 0) * Number(pkg.duration_days || 1)).toFixed(2))
      : 0;

    const suggestedVehicle = vehicles.length > 0 ? {
      vehicle_id: vehicles[0].vehicle_id,
      vehicle_name: vehicles[0].vehicle_name,
      vehicle_type: vehicles[0].vehicle_type,
      capacity: vehicles[0].capacity,
      price_per_day: vehicles[0].price_per_day,
    } : null;

    const estimatedTotal = parseFloat((packageCost + entryFees + transportCost).toFixed(2));

    return successResponse(res, {
      package_id: pkg.package_id,
      title: pkg.title,
      duration_days: pkg.duration_days,
      num_adults,
      num_children,
      package_cost: packageCost,
      entry_fees: entryFees,
      transport_cost: transportCost,
      estimated_total: estimatedTotal,
      suggested_vehicle: suggestedVehicle,
      note: 'Estimated total includes package fee, attraction entry fees, and suggested transport.',
    });
  } catch (err) { next(err); }
};
