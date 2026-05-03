const { mongoose, makeSchema } = require('./schemaHelper');

const Feedback = mongoose.model('Feedback', makeSchema({
  feedback_id: { type: Number, index: true, unique: true },
  user_id: { type: Number, index: true },
  target_type: { type: String, index: true },
  target_id: { type: Number, index: true },
  booking_id: { type: Number, index: true },
  rating: { type: Number, index: true },
  comment: { type: String },
  sentiment: { type: String, index: true },
  is_flagged: { type: Boolean, index: true, default: false },
  admin_response: { type: String },
  admin_responder_id: { type: Number, index: true },
  response_date: { type: Date },
}), 'feedback');

module.exports = Feedback;
