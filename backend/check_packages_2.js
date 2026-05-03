const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Package = require('./models/Package');

async function checkPackages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Package.countDocuments({});
    console.log(`Total Packages: ${count}`);
    
    const latest = await Package.find({}).sort({ _id: -1 }).limit(10).lean();
    latest.forEach(p => {
      console.log(`- ID: ${p.package_id}, Title: ${p.title || p.name}, Active: ${p.is_active}, CreatedAt: ${p.created_at}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPackages();
