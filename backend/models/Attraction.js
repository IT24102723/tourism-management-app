const { mongoose, makeSchema } = require('./schemaHelper');

const Attraction = mongoose.model('Attraction', makeSchema({
  attraction_id: { type: Number, index: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  city: { type: String, index: true },
  category: { type: String, index: true },
  entrance_fee: { type: Number, default: 0 },
  opening_hours: { type: String },
  image_url: { type: String },
  operational_status: { type: String, index: true },
  average_rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
}), 'attractions');

module.exports = Attraction;
