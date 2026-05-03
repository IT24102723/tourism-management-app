// config/mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectMongo() {
  if (isConnected) return mongoose.connection;

  require('dotenv').config({ 
    path: require('path').join(__dirname, '../.env'),
    override: true 
  });
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }

  // Debug: verify exactly what string is being used
  console.log(`📡 REAL-TIME URI CHECK: ${uri.substring(0, 20)}...`);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  isConnected = true;
  console.log('✅  MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectMongo, mongoose };
