const { mongoose, makeSchema } = require('./schemaHelper');

const AttractionAnalytics = mongoose.model('AttractionAnalytics', makeSchema({
  analytics_id: { type: Number, index: true, unique: true },
  attraction_id: { type: Number, index: true },
  year: { type: Number, index: true },
  month: { type: Number, index: true },
  visit_count: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}), 'attraction_analytics');

module.exports = AttractionAnalytics;
