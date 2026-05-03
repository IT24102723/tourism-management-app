const { mongoose, makeSchema } = require('./schemaHelper');

const InquiryResponse = mongoose.model('InquiryResponse', makeSchema({
  response_id: { type: Number, index: true, unique: true },
  inquiry_id: { type: Number, index: true },
  responder_id: { type: Number, index: true },
  message: { type: String, required: true },
}), 'inquiry_responses');

module.exports = InquiryResponse;
