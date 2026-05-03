// controllers/inquiry.controller.js
// Module 6 (Mongo): Inquiry Workflow
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/helpers');
const { ROLES } = require('../config/jwt');
const { getNextNumericId } = require('../utils/mongoIds');
const { Inquiry, InquiryResponse, User } = require('../models');

// POST /api/v1/inquiries  (anyone, including guests)
exports.submitInquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { subject, message, category = 'General', priority = 'Medium' } = req.body;
    const user_id = req.user?.user_id || null;

    const inquiry_id = await getNextNumericId(Inquiry, 'inquiry_id');
    await Inquiry.create({
      inquiry_id,
      user_id,
      assigned_agent_id: null,
      subject,
      message,
      category,
      priority,
      status: 'Submitted',
      resolution_notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return successResponse(res, { inquiry_id }, 'Inquiry submitted successfully.', 201);
  } catch (err) { next(err); }
};

// GET /api/v1/inquiries
exports.listInquiries = async (req, res, next) => {
  try {
    const privileged = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY, ROLES.SUPPORT_AGENT, ROLES.SERVICE_PROVIDER].includes(req.user.role);
    const { status, category, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (!privileged) where.user_id = req.user.user_id;
    if (status) where.status = status;
    if (category) where.category = category;

    console.log('📨 Inquiry Filter - where:', where, 'status param:', status, 'category param:', category);

    const inquiries = await Inquiry.find(where)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    console.log('📨 Inquiry Filter Results:', inquiries.length, 'inquiries found');

    const userIds = [...new Set(inquiries.map((i) => i.user_id).filter(Boolean))];
    const agentIds = [...new Set(inquiries.map((i) => i.assigned_agent_id).filter(Boolean))];
    const ids = [...new Set([...userIds, ...agentIds])];

    const users = ids.length
      ? await User.find({ user_id: { $in: ids } }, { user_id: 1, username: 1, email: 1 }).lean()
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    const rows = inquiries.map((i) => ({
      ...i,
      username: userMap.get(i.user_id)?.username || null,
      email: userMap.get(i.user_id)?.email || null,
      agent_username: userMap.get(i.assigned_agent_id)?.username || null,
    }));

    return successResponse(res, { inquiries: rows });
  } catch (err) { next(err); }
};

// GET /api/v1/inquiries/:id
exports.getInquiry = async (req, res, next) => {
  try {
    const inq = await Inquiry.findOne({ inquiry_id: Number(req.params.id) }).lean();
    if (!inq) return errorResponse(res, 'Inquiry not found.', 404);

    const privileged = [ROLES.ADMIN, ROLES.TOURISM_AUTHORITY, ROLES.SUPPORT_AGENT].includes(req.user.role);
    if (!privileged && inq.user_id !== req.user.user_id)
      return errorResponse(res, 'Access denied.', 403);

    const responses = await InquiryResponse.find({ inquiry_id: Number(req.params.id) }).sort({ created_at: 1 }).lean();
    const responderIds = [...new Set(responses.map((r) => r.responder_id).filter(Boolean))];
    const responderUsers = responderIds.length
      ? await User.find({ user_id: { $in: responderIds } }, { user_id: 1, username: 1, role: 1 }).lean()
      : [];
    const responderMap = new Map(responderUsers.map((u) => [u.user_id, u]));

    const enrichedResponses = responses.map((r) => ({
      ...r,
      username: responderMap.get(r.responder_id)?.username || null,
      role: responderMap.get(r.responder_id)?.role || null,
    }));

    return successResponse(res, { ...inq, responses: enrichedResponses });
  } catch (err) { next(err); }
};

// POST /api/v1/inquiries/:id/respond
exports.respondToInquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const { message } = req.body;
    const inquiry_id = Number(req.params.id);

    const inq = await Inquiry.findOne({ inquiry_id }).lean();
    if (!inq) return errorResponse(res, 'Inquiry not found.', 404);
    if (inq.status === 'Closed') return errorResponse(res, 'Cannot respond to a closed inquiry.', 409);

    const response_id = await getNextNumericId(InquiryResponse, 'response_id');
    await InquiryResponse.create({
      response_id,
      inquiry_id,
      responder_id: req.user.user_id,
      message,
      created_at: new Date(),
    });

    if (['Submitted', 'Pending'].includes(inq.status)) {
      await Inquiry.updateOne(
        { inquiry_id },
        { $set: { status: 'Responded', assigned_agent_id: req.user.user_id, updated_at: new Date() } }
      );
    }

    return successResponse(res, {}, 'Response submitted. Inquiry status updated to Responded.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/inquiries/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed.', 422, errors.array());

    const WORKFLOW = ['Submitted', 'Pending', 'Responded', 'Closed'];
    const inq = await Inquiry.findOne({ inquiry_id: Number(req.params.id) }, { inquiry_id: 1, status: 1 }).lean();
    if (!inq) return errorResponse(res, 'Inquiry not found.', 404);

    const currentIdx = WORKFLOW.indexOf(inq.status);
    const newIdx = WORKFLOW.indexOf(req.body.status);
    if (newIdx < currentIdx)
      return errorResponse(res, `Cannot revert status from "${inq.status}" to "${req.body.status}".`, 409);

    await Inquiry.updateOne(
      { inquiry_id: Number(req.params.id) },
      { $set: { status: req.body.status, updated_at: new Date() } }
    );

    return successResponse(res, {}, `Status updated to ${req.body.status}.`);
  } catch (err) { next(err); }
};

// PATCH /api/v1/inquiries/:id/assign
exports.assignAgent = async (req, res, next) => {
  try {
    const { agent_id } = req.body;
    const agent = await User.findOne({ user_id: Number(agent_id), is_active: 1 }, { role: 1 }).lean();
    if (!agent || agent.role !== ROLES.SUPPORT_AGENT)
      return errorResponse(res, 'Agent not found or not a Support_Agent.', 400);

    const inq = await Inquiry.findOne({ inquiry_id: Number(req.params.id) }, { status: 1 }).lean();
    if (!inq) return errorResponse(res, 'Inquiry not found.', 404);

    const nextStatus = inq.status === 'Submitted' ? 'Pending' : inq.status;
    await Inquiry.updateOne(
      { inquiry_id: Number(req.params.id) },
      { $set: { assigned_agent_id: Number(agent_id), status: nextStatus, updated_at: new Date() } }
    );

    return successResponse(res, {}, 'Inquiry assigned to agent. Status moved to Pending.');
  } catch (err) { next(err); }
};
