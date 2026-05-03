// One-time normalization: convert boolean/string is_active to integers in packages collection
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.db.collection('packages');

  const r1 = await col.updateMany({ is_active: true },  { $set: { is_active: 1 } });
  const r2 = await col.updateMany({ is_active: false }, { $set: { is_active: 0 } });
  const r3 = await col.updateMany({ is_active: '1' },   { $set: { is_active: 1 } });
  const r4 = await col.updateMany({ is_active: '0' },   { $set: { is_active: 0 } });

  console.log('Normalized — true→1:', r1.modifiedCount, '| false→0:', r2.modifiedCount, '| "1"→1:', r3.modifiedCount, '| "0"→0:', r4.modifiedCount);

  const active   = await col.countDocuments({ is_active: 1 });
  const inactive = await col.countDocuments({ is_active: 0 });
  console.log('After normalization — active:', active, '| inactive:', inactive);

  await mongoose.disconnect();
  console.log('Done.');
}).catch(err => { console.error(err); process.exit(1); });
