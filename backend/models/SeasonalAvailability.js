const { mongoose, makeSchema } = require('./schemaHelper');

const SeasonalAvailability = mongoose.model('SeasonalAvailability', makeSchema({
  availability_id: { type: Number, index: true, unique: true },
  attraction_id: { type: Number, index: true },
  season: { type: String, index: true },
  notes: { type: String },
}), 'seasonal_availability');

module.exports = SeasonalAvailability;
