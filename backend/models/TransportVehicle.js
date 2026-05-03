const { mongoose, makeSchema } = require('./schemaHelper');

const TransportVehicle = mongoose.model('TransportVehicle', makeSchema({
  vehicle_id: { type: Number, index: true, unique: true },
  provider_id: { type: Number, index: true },
  vehicle_type: { type: String, index: true },
  registration_number: { type: String, index: true, unique: true, sparse: true },
  capacity: { type: Number },
  status: { type: String, default: 'Available' },
}), 'transport_vehicles');

module.exports = TransportVehicle;
