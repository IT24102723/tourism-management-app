const { mongoose, makeSchema } = require('./schemaHelper');

const Booking = mongoose.model('Booking', makeSchema({
  booking_id: { type: Number, index: true, unique: true },
  user_id: { type: Number, index: true },
  package_id: { type: Number, index: true },
  schedule_id: { type: Number, index: true },
  attraction_id: { type: Number, index: true },
  booking_type: { type: String, index: true },
  booking_status: { type: String, index: true },
  total_price: { type: Number },
  booking_date: { type: Date, default: Date.now },
}), 'bookings');

module.exports = Booking;
