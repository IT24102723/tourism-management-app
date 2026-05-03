const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Package = require('./models/Package');

async function checkPackages() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tourism_management');
    console.log('Connected to MongoDB');

    const packages = await Package.find({}).sort({ created_at: -1 }).limit(5).lean();
    console.log('Latest 5 Packages:');
    packages.forEach(p => {
      console.log(`- ID: ${p.package_id}, Title: ${p.title || p.name}, Active: ${p.is_active}, Provider: ${p.provider_id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPackages();
