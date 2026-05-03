// utils/mongoIds.js

async function getNextNumericId(model, fieldName) {
  const top = await model.findOne({}, { [fieldName]: 1 }).sort({ [fieldName]: -1 }).lean();
  const val = top ? top[fieldName] : 0;
  return (val ? Number(val) : 0) + 1;
}

module.exports = { getNextNumericId };
