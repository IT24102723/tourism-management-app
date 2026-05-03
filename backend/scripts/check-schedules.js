const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.db.collection('schedules');
  const all = await col.find({}).project({ schedule_id:1, package_id:1, status:1, departure_location:1, arrival_location:1, departure_time:1, total_cost:1 }).limit(20).toArray();
  console.log('Total schedules:', await col.countDocuments());
  console.log('With package_id:', await col.countDocuments({ package_id: { $ne: null, $exists: true } }));
  console.log('Status values:', await col.distinct('status'));
  console.log('Sample:', JSON.stringify(all, null, 2));
  await mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
