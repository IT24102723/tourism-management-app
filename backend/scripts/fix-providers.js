const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://tourism_admin:Tourism2024@ac-0kmlsfu-shard-00-00.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-01.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-02.gwzawxa.mongodb.net:27017/Tourism_Mobile?ssl=true&replicaSet=atlas-o2rakr-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function fixProviders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    // We can define the schema loosely
    const spSchema = new mongoose.Schema({}, { strict: false });
    const ServiceProvider = mongoose.model('ServiceProvider', spSchema, 'service_providers');
    
    const result = await ServiceProvider.updateMany(
      { status: 'Pending' },
      { $set: { status: 'Active', is_active: 1, is_verified: 1 } }
    );
    
    console.log(`Updated ${result.modifiedCount} pending providers to Active.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fixProviders();
