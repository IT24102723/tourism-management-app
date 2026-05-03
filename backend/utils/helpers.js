// utils/helpers.js — Shared utility functions

/**
 * Build a standard JSON response envelope.
 */
const successResponse = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

/**
 * Classify review text sentiment with a simple keyword heuristic.
 * Replace with an NLP library / external API call in production.
 * @param {string} text
 * @returns {'Positive'|'Neutral'|'Negative'}
 */
const classifySentiment = (text = '') => {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'fantastic',
                         'wonderful', 'perfect', 'best', 'good', 'awesome',
                         'superb', 'brilliant', 'beautiful', 'recommend'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst',
                         'disappointing', 'poor', 'dirty', 'rude', 'broken',
                         'scam', 'waste', 'never', 'avoid'];

  const posScore = positiveWords.filter(w => lower.includes(w)).length;
  const negScore = negativeWords.filter(w => lower.includes(w)).length;

  if (posScore > negScore) return 'Positive';
  if (negScore > posScore) return 'Negative';
  return 'Neutral';
};

/**
 * Calculate final booking amount after applying all matching discount rules.
 * @param {number}   baseAmount
 * @param {object[]} rules       — active discount_rules rows from DB
 * @param {object}   context     — { numPersons, advanceDays, bookingType, travelMonth }
 * @returns {{ discount: number, final: number }}
 */
const applyDiscounts = (baseAmount, rules = [], context = {}) => {
  let totalDiscount = 0;

  for (const rule of rules) {
    if (!rule.is_active) continue;

    // Group discount
    if (rule.rule_type === 'Group' && (context.numPersons || 1) < rule.min_persons) continue;

    // Early-bird discount
    if (rule.rule_type === 'Early_Bird' && (context.advanceDays || 0) < rule.min_advance_days) continue;

    if (rule.rule_type === 'Percentage') {
      totalDiscount += (baseAmount * rule.discount_value) / 100;
    } else if (rule.rule_type === 'Fixed') {
      totalDiscount += rule.discount_value;
    } else {
      // Treat all other types the same as Percentage for now
      totalDiscount += (baseAmount * rule.discount_value) / 100;
    }
  }

  const discount = Math.min(totalDiscount, baseAmount); // cannot exceed base
  return {
    discount: parseFloat(discount.toFixed(2)),
    final:    parseFloat((baseAmount - discount).toFixed(2)),
  };
};

/**
 * Check whether two datetime ranges overlap.
 * Used for transport / schedule conflict detection.
 * @param {Date} startA  @param {Date} endA
 * @param {Date} startB  @param {Date} endB
 * @returns {boolean}
 */
const hasOverlap = (startA, endA, startB, endB) =>
  startA < endB && startB < endA;

/**
 * Paginate a raw MySQL query result set.
 */
const paginate = (items, page = 1, limit = 10) => {
  const start    = (page - 1) * limit;
  const data     = items.slice(start, start + limit);
  return {
    data,
    pagination: {
      total:       items.length,
      page:        Number(page),
      limit:       Number(limit),
      total_pages: Math.ceil(items.length / limit),
    },
  };
};

module.exports = { successResponse, errorResponse, classifySentiment, applyDiscounts, hasOverlap, paginate };
