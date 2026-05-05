const { mongoose, makeSchema } = require('./schemaHelper');

const TransportVehicle = mongoose.model('TransportVehicle', makeSchema({
  vehicle_id: { type: Number, index: true, unique: true },
  provider_id: { type: Number, index: true },
  vehicle_type: { type: String, index: true },
  registration_number: { type: String, index: true, unique: true, sparse: true },
  capacity: { type: Number },
  status: { type: String, default: 'Available' },
  price_per_day: { type: Number, default: 0 },
  price_per_km: { type: Number, default: 0 },
}), 'transport_vehicles');

module.exports = TransportVehicle;
