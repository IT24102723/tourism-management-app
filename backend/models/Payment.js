const { mongoose, makeSchema } = require('./schemaHelper');

const Payment = mongoose.model('Payment', makeSchema({
  payment_id: { type: Number, index: true, unique: true },
  booking_id: { type: Number, index: true },
  user_id: { type: Number, index: true },
  payment_method: { type: String, index: true },
  payment_status: { type: String, index: true },
  amount: { type: Number },
  transaction_ref: { type: String, index: true, unique: true, sparse: true },
}), 'payments');

module.exports = Payment;
