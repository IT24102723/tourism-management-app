const { mongoose, makeSchema } = require('./schemaHelper');

const PackageAttraction = mongoose.model('PackageAttraction', makeSchema({
  id: { type: Number, index: true, unique: true },
  package_id: { type: Number, index: true },
  attraction_id: { type: Number, index: true },
}), 'package_attractions');

module.exports = PackageAttraction;
