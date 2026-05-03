const { mongoose, makeSchema } = require('./schemaHelper');

const AttractionImage = mongoose.model('AttractionImage', makeSchema({
  image_id: { type: Number, index: true, unique: true },
  attraction_id: { type: Number, index: true },
  image_url: { type: String, required: true },
  is_main: { type: Boolean, default: false },
}), 'attraction_images');

module.exports = AttractionImage;
