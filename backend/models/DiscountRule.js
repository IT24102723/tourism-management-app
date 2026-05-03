const { mongoose, makeSchema } = require('./schemaHelper');

const DiscountRule = mongoose.model('DiscountRule', makeSchema({
  rule_id: { type: Number, index: true, unique: true },
  name: { type: String },
  discount_percentage: { type: Number },
  rule_type: { type: String, index: true },
  applicable_to: { type: String, index: true },
  is_active: { type: Boolean, index: true, default: true },
}), 'discount_rules');

module.exports = DiscountRule;
