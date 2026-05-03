const { mongoose } = require('../config/mongo');

const opts = {
  versionKey: false,
  strict: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

function makeSchema(definition) {
  return new mongoose.Schema(definition, opts);
}

module.exports = { mongoose, makeSchema };
