const { mongoose, makeSchema } = require('./schemaHelper');

const Schedule = mongoose.model('Schedule', makeSchema({
  schedule_id: { type: Number, index: true, unique: true },
  package_id: { type: Number, index: true },
  vehicle_id: { type: Number, index: true },
  departure_time: { type: Date },
  arrival_time: { type: Date },
  status: { type: String, index: true },
}), 'schedules');

module.exports = Schedule;
