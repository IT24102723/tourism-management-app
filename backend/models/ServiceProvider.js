const { mongoose, makeSchema } = require('./schemaHelper');

const ServiceProvider = mongoose.model('ServiceProvider', makeSchema({
  provider_id: { type: Number, index: true, unique: true },
  user_id: { type: Number, index: true },
  business_name: { type: String },
  name: { type: String }, // For compatibility
  business_type: { type: String, index: true },
  description: { type: String },
  contact_number: { type: String },
  contact_phone: { type: String },
  contact_email: { type: String },
  website: { type: String },
  address: { type: String },
  city: { type: String },
  license_number: { type: String },
  image_url: { type: String },
  status: { type: String, index: true },
  is_active: { type: Number, default: 0 },
  is_verified: { type: Number, default: 0 },
  average_rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}), 'service_providers');

module.exports = ServiceProvider;
