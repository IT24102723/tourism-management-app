const { mongoose, makeSchema } = require('./schemaHelper');

const Package = mongoose.model('Package', makeSchema({
  package_id: { type: Number, index: true, unique: true },
  provider_id: { type: Number, index: true },
  name: { type: String }, // Old schema
  title: { type: String }, // New schema
  description: { type: String },
  price: { type: Number }, // Old schema
  price_per_person: { type: Number }, // New schema
  max_capacity: { type: Number },
  current_bookings: { type: Number, default: 0 },
  created_by: { type: Number },
  inclusions: { type: String },
  package_type: { type: String, index: true },
  duration_days: { type: Number },
  image_url: { type: String },
  is_active: { type: mongoose.Schema.Types.Mixed, index: true }, // Changed to Mixed to support both Boolean and Number
}), 'packages');

module.exports = Package;
