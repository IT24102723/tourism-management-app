const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://tourism_admin:Tourism2024@ac-0kmlsfu-shard-00-00.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-01.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-02.gwzawxa.mongodb.net:27017/Tourism_Mobile?ssl=true&replicaSet=atlas-o2rakr-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    const spSchema = new mongoose.Schema({}, { strict: false });
    const ServiceProvider = mongoose.model('ServiceProvider', spSchema, 'service_providers');
    
    await ServiceProvider.updateOne({ provider_id: 3001 }, { $set: { business_type: 'Tour Guide', business_name: 'Paradise Tours', average_rating: 4.8, rating_count: 12, status: 'Active', is_active: 1, city: 'Colombo' } });
    await ServiceProvider.updateOne({ provider_id: 3002 }, { $set: { business_type: 'Transport', business_name: 'Adventure Seekers', average_rating: 4.5, rating_count: 8, status: 'Active', is_active: 1, city: 'Kandy' } });
    await ServiceProvider.updateOne({ provider_id: 3003 }, { $set: { business_type: 'Hotel', business_name: 'Heritage Explorers', average_rating: 4.9, rating_count: 25, status: 'Active', is_active: 1, city: 'Galle' } });
    
    await ServiceProvider.deleteMany({ provider_id: { $in: [3004, 3005, 3006] } });
    await ServiceProvider.create([
      { provider_id: 3004, business_name: 'Lanka Grand Hotel', business_type: 'Hotel', average_rating: 4.7, rating_count: 45, status: 'Active', is_active: 1, city: 'Colombo', description: 'Luxury hotel in the heart of Colombo.' },
      { provider_id: 3005, business_name: 'Blue Water Safaris', business_type: 'Tour Guide', average_rating: 3.2, rating_count: 5, status: 'Active', is_active: 1, city: 'Mirissa', description: 'Whale watching and coastal tours.' },
      { provider_id: 3006, business_name: 'Rapid Transport', business_type: 'Transport', average_rating: 4.2, rating_count: 15, status: 'Active', is_active: 1, city: 'Negombo', description: 'Reliable airport transfers and island-wide travel.' }
    ]);

    console.log('Database updated with sample providers.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
