// controllers/transport.controller.js
// Module 4 (Mongo): Schedule & Transport Management
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/helpers');
const { getNextNumericId } = require('../utils/mongoIds');
const { TransportVehicle, ServiceProvider, Schedule } = require('../models');

// ── Vehicles ──────────────────────────────────────────────────
exports.listVehicles = async (req, res, next) => {
  try {
    const { type, available } = req.query;

    const where = {};
    if (type) where.vehicle_type = type;

    // Check if user is admin/authority (optionalToken means req.user may be null)
    const userRole = req.user?.role || '';
    const isAdmin = ['Admin', 'Tourism_Authority'].includes(userRole);

    console.log('🚗 listVehicles - role:', userRole, 'isAdmin:', isAdmin);

    if (!isAdmin) {
      if (userRole === 'Service_Provider') {
        const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
        if (sp) where.provider_id = sp.provider_id;
        else where.provider_id = -1; // Force empty list if profile missing
      } else {
        // For non-admins (Tourists): filter by availability if requested
        if (available !== undefined) {
          where.is_available = available === 'true' ? 1 : 0;
        }

        // Show vehicles from active/verified providers OR vehicles with no provider
        const activeProviders = await ServiceProvider.find({ 
          $or: [
            { status: 'verified' },
            { status: 'Active' },
            { status: 'Pending' },
            { is_active: 1 }
          ]
        }, { provider_id: 1 }).lean();
        
        const activeIds = activeProviders.map((p) => p.provider_id);
        const providerOrConditions = [
          { provider_id: null },
          { provider_id: { $exists: false } },
        ];
        if (activeIds.length > 0) {
          providerOrConditions.push({ provider_id: { $in: activeIds } });
        }

        // Merge with existing $or if any, otherwise set directly
        if (where.$or) {
          where.$and = [{ $or: where.$or }, { $or: providerOrConditions }];
          delete where.$or;
        } else {
          where.$or = providerOrConditions;
        }
      }
    }
    // Admin sees ALL vehicles — no extra filter

    console.log('🚗 listVehicles query where:', JSON.stringify(where));
    const vehicles = await TransportVehicle.find(where).lean();
    console.log('🚗 listVehicles found:', vehicles.length, 'vehicles');
    const providerIds = [...new Set(vehicles.map((v) => v.provider_id).filter(Boolean))];
    const providers = providerIds.length
      ? await ServiceProvider.find({ provider_id: { $in: providerIds } }, { provider_id: 1, business_name: 1, status: 1 }).lean()
      : [];
    const providerMap = new Map(providers.map((p) => [p.provider_id, p]));

    const rows = vehicles.map((v) => ({
      ...v,
      business_name: providerMap.get(v.provider_id)?.business_name || null,
      provider_status: providerMap.get(v.provider_id)?.status || null,
    }));

    return successResponse(res, { vehicles: rows });
  } catch (err) { next(err); }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await TransportVehicle.findOne({ vehicle_id: Number(req.params.id) }).lean();
    if (!vehicle) return errorResponse(res, 'Vehicle not found.', 404);
    return successResponse(res, vehicle);
  } catch (err) { next(err); }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      provider_id,
      vehicle_type,
      vehicle_name,
      registration_number,
      capacity,
      is_airconditioned = false,
      price_per_km,
      price_per_day,
    } = req.body;

    let finalProviderId = provider_id || null;
    if (['SERVICE_PROVIDER', 'Service_Provider'].includes(req.user.role)) {
      const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
      if (sp) finalProviderId = sp.provider_id;
    }

    const vehicle_id = await getNextNumericId(TransportVehicle, 'vehicle_id');
    await TransportVehicle.create({
      vehicle_id,
      provider_id: finalProviderId,
      vehicle_type,
      vehicle_name: vehicle_name || null,
      registration_number,
      capacity,
      is_airconditioned: is_airconditioned ? 1 : 0,
      is_available: 1,
      price_per_km: price_per_km || null,
      price_per_day: price_per_day || null,
      created_at: new Date(),
    });

    return successResponse(res, { vehicle_id }, 'Vehicle registered.', 201);
  } catch (err) { next(err); }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const id = Number(req.params.id);
    const vehicleExists = await TransportVehicle.findOne({ vehicle_id: id }, { vehicle_id: 1 }).lean();
    if (!vehicleExists) return errorResponse(res, 'Vehicle not found.', 404);

    const { vehicle_type, vehicle_name, registration_number, capacity, is_airconditioned, price_per_km, price_per_day } = req.body;

    // If a new registration number is provided, ensure it is not already taken by a different vehicle.
    if (registration_number) {
      const conflict = await TransportVehicle.findOne(
        { registration_number, vehicle_id: { $ne: id } },
        { vehicle_id: 1 }
      ).lean();
      if (conflict) return errorResponse(res, `Registration number '${registration_number}' is already in use by vehicle #${conflict.vehicle_id}.`, 409);
    }

    const patch = {};
    if (vehicle_type        !== undefined) patch.vehicle_type        = vehicle_type;
    if (vehicle_name        !== undefined) patch.vehicle_name        = vehicle_name;
    if (registration_number !== undefined) patch.registration_number = registration_number;
    if (capacity            !== undefined) patch.capacity            = capacity;
    if (is_airconditioned   !== undefined) patch.is_airconditioned   = is_airconditioned;
    if (price_per_km        !== undefined) patch.price_per_km        = price_per_km;
    if (price_per_day       !== undefined) patch.price_per_day       = price_per_day;

    await TransportVehicle.updateOne({ vehicle_id: id }, { $set: patch });
    return successResponse(res, {}, 'Vehicle updated.');
  } catch (err) { next(err); }
};

exports.updateVehicleAvailability = async (req, res, next) => {
  try {
    await TransportVehicle.updateOne(
      { vehicle_id: Number(req.params.id) },
      { $set: { is_available: req.body.is_available ? 1 : 0 } }
    );
    return successResponse(res, {}, 'Availability updated.');
  } catch (err) { next(err); }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await TransportVehicle.findOne({ vehicle_id: Number(req.params.id) }, { vehicle_id: 1 }).lean();
    if (!vehicle) return errorResponse(res, 'Vehicle not found.', 404);

    const active = await Schedule.findOne({
      vehicle_id: Number(req.params.id),
      status: { $nin: ['Cancelled', 'Completed'] },
    }, { schedule_id: 1 }).lean();

    if (active) {
      return errorResponse(res, 'Cannot delete: vehicle has active schedules. Cancel them first.', 409);
    }

    await TransportVehicle.deleteOne({ vehicle_id: Number(req.params.id) });
    return successResponse(res, {}, 'Vehicle deleted.');
  } catch (err) { next(err); }
};

// ── Schedules ─────────────────────────────────────────────────
exports.listSchedules = async (req, res, next) => {
  try {
    const { package_id, date, status, vehicle_id } = req.query;

    const where = {};
    if (package_id) where.package_id = Number(package_id);
    if (status) where.status = status;
    if (vehicle_id) where.vehicle_id = Number(vehicle_id);
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.departure_time = { $gte: start, $lte: end };
    }

    // Filter by provider if Service Provider
    if (req.user?.role === 'Service_Provider') {
      const sp = await ServiceProvider.findOne({ user_id: req.user.user_id }, { provider_id: 1 }).lean();
      if (sp) {
        const myVehicles = await TransportVehicle.find({ provider_id: sp.provider_id }, { vehicle_id: 1 }).lean();
        const myVehicleIds = myVehicles.map(v => v.vehicle_id);
        where.vehicle_id = { $in: myVehicleIds };
      } else {
        where.vehicle_id = -1;
      }
    }

    const schedules = await Schedule.find(where).sort({ departure_time: 1 }).lean();
    const vehicleIds = [...new Set(schedules.map((s) => s.vehicle_id).filter(Boolean))];
    const vehicles = vehicleIds.length
      ? await TransportVehicle.find(
          { vehicle_id: { $in: vehicleIds } },
          { vehicle_id: 1, vehicle_name: 1, vehicle_type: 1, registration_number: 1 }
        ).lean()
      : [];
    const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]));

    const rows = schedules.map((s) => ({
      ...s,
      vehicle_name: vehicleMap.get(s.vehicle_id)?.vehicle_name || null,
      vehicle_type: vehicleMap.get(s.vehicle_id)?.vehicle_type || null,
      registration_number: vehicleMap.get(s.vehicle_id)?.registration_number || null,
    }));

    return successResponse(res, { schedules: rows });
  } catch (err) { next(err); }
};

exports.getSchedule = async (req, res, next) => {
  try {
    const sched = await Schedule.findOne({ schedule_id: Number(req.params.id) }).lean();
    if (!sched) return errorResponse(res, 'Schedule not found.', 404);
    return successResponse(res, sched);
  } catch (err) { next(err); }
};

exports.createSchedule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const {
      package_id,
      vehicle_id,
      title,
      departure_location,
      arrival_location,
      departure_time,
      arrival_time,
      total_distance_km,
    } = req.body;

    const dep = new Date(departure_time);
    const arr = new Date(arrival_time);

    const conflicts = await Schedule.find({
      vehicle_id: Number(vehicle_id),
      status: { $nin: ['Cancelled', 'Completed'] },
      departure_time: { $lt: arr },
      arrival_time: { $gt: dep },
    }, { schedule_id: 1 }).lean();

    const conflict_flag = conflicts.length > 0 ? 1 : 0;
    const conflict_notes = conflict_flag ? `Conflicts with schedule(s): ${conflicts.map((c) => c.schedule_id).join(', ')}` : null;

    let total_cost = null;
    if (total_distance_km) {
      const vh = await TransportVehicle.findOne({ vehicle_id: Number(vehicle_id) }, { price_per_km: 1, price_per_day: 1 }).lean();
      if (vh && vh.price_per_km) total_cost = parseFloat((Number(total_distance_km) * Number(vh.price_per_km)).toFixed(2));
    }

    const schedule_id = await getNextNumericId(Schedule, 'schedule_id');
    await Schedule.create({
      schedule_id,
      package_id: package_id ? Number(package_id) : null,
      vehicle_id: Number(vehicle_id),
      title: title || null,
      departure_location,
      arrival_location,
      departure_time: dep,
      arrival_time: arr,
      total_distance_km: total_distance_km || null,
      total_cost,
      status: 'Scheduled',
      conflict_flag,
      conflict_notes,
      created_by: req.user.user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (!conflict_flag) {
      await TransportVehicle.updateOne({ vehicle_id: Number(vehicle_id) }, { $set: { is_available: 0 } });
    }

    const code = conflict_flag ? 207 : 201;
    return res.status(code).json({
      success: true,
      message: conflict_flag ? 'Schedule created with conflict warning.' : 'Schedule created.',
      data: { schedule_id, conflict_flag: !!conflict_flag, conflict_notes, total_cost },
    });
  } catch (err) { next(err); }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const { title, departure_location, arrival_location, departure_time, arrival_time, status } = req.body;
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (departure_location !== undefined) patch.departure_location = departure_location;
    if (arrival_location !== undefined) patch.arrival_location = arrival_location;
    if (departure_time !== undefined) patch.departure_time = new Date(departure_time);
    if (arrival_time !== undefined) patch.arrival_time = new Date(arrival_time);
    if (status !== undefined) patch.status = status;
    patch.updated_at = new Date();

    await Schedule.updateOne({ schedule_id: Number(req.params.id) }, { $set: patch });
    return successResponse(res, {}, 'Schedule updated.');
  } catch (err) { next(err); }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    await Schedule.updateOne(
      { schedule_id: Number(req.params.id) },
      { $set: { status: 'Cancelled', updated_at: new Date() } }
    );
    return successResponse(res, {}, 'Schedule cancelled.');
  } catch (err) { next(err); }
};

// GET /api/v1/transport/schedules/:id/alternatives
exports.suggestAlternatives = async (req, res, next) => {
  try {
    const sched = await Schedule.findOne({ schedule_id: Number(req.params.id) }).lean();
    if (!sched) return errorResponse(res, 'Schedule not found.', 404);

    const duration = new Date(sched.arrival_time) - new Date(sched.departure_time);

    const busy = await Schedule.find({
      status: { $nin: ['Cancelled', 'Completed'] },
      departure_time: { $lt: new Date(sched.arrival_time) },
      arrival_time: { $gt: new Date(sched.departure_time) },
    }, { vehicle_id: 1 }).lean();
    const busyIds = new Set(busy.map((b) => b.vehicle_id));

    const candidates = await TransportVehicle.find({ is_available: 1, vehicle_id: { $ne: sched.vehicle_id } }).lean();
    const alternatives = candidates
      .filter((v) => !busyIds.has(v.vehicle_id))
      .sort((a, b) => Number(a.price_per_day || 0) - Number(b.price_per_day || 0))
      .slice(0, 5)
      .map((v) => ({
        vehicle_id: v.vehicle_id,
        vehicle_type: v.vehicle_type,
        vehicle_name: v.vehicle_name,
        capacity: v.capacity,
        price_per_day: v.price_per_day,
      }));

    const plus2h = new Date(new Date(sched.departure_time).getTime() + 2 * 3600000);
    const plus4h = new Date(new Date(sched.departure_time).getTime() + 4 * 3600000);
    const end2h = new Date(plus2h.getTime() + duration);
    const end4h = new Date(plus4h.getTime() + duration);

    return successResponse(res, {
      original_conflict: sched.conflict_notes,
      alternative_vehicles: alternatives,
      alternative_time_slots: [
        { departure_time: plus2h, arrival_time: end2h, label: '+2 hours later' },
        { departure_time: plus4h, arrival_time: end4h, label: '+4 hours later' },
      ],
    }, 'Alternative slots suggested.');
  } catch (err) { next(err); }
};
