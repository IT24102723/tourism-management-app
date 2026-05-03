const { mongoose, makeSchema } = require('./schemaHelper');

const Inquiry = mongoose.model('Inquiry', makeSchema({
  inquiry_id: { type: Number, index: true, unique: true },
  user_id: { type: Number, index: true },
  assigned_agent_id: { type: Number, index: true },
  subject: { type: String },
  message: { type: String },
  category: { type: String, index: true },
  priority: { type: String, index: true },
  status: { type: String, index: true },
}), 'inquiries');

module.exports = Inquiry;
