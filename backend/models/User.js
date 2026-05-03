const { mongoose, makeSchema } = require('./schemaHelper');

const User = mongoose.model('User', makeSchema({
  user_id: { type: Number, index: true, unique: true },
  username: { type: String, index: true, unique: true },
  email: { type: String, index: true, unique: true },
  password_hash: { type: String },
  role: { type: String, default: 'Tourist' },
  full_name: { type: String },
  phone: { type: String },
  profile_image: { type: String },
  is_active: { type: Number, default: 1 },
  email_verified: { type: Number, default: 0 },
}), 'users');

module.exports = User;
