const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://tourism_admin:Tourism2024@ac-0kmlsfu-shard-00-00.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-01.gwzawxa.mongodb.net:27017,ac-0kmlsfu-shard-00-02.gwzawxa.mongodb.net:27017/Tourism_Mobile?ssl=true&replicaSet=atlas-o2rakr-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const ProviderSchema = new mongoose.Schema({
  provider_id: Number,
  user_id: Number,
  business_name: String,
  business_type: String,
  status: String,
  is_active: Number,
  city: String,
  average_rating: Number,
  rating_count: Number,
  image_url: String
}, { collection: 'serviceproviders' });

const UserSchema = new mongoose.Schema({
  user_id: Number,
  username: String,
  role: String
}, { collection: 'users' });

const Provider = mongoose.model('Provider', ProviderSchema);
const User = mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const providerUsers = await User.find({ role: 'Service_Provider' }).limit(4);
  
  if (providerUsers.length < 2) {
    console.log('Not enough Service_Provider users found to seed.');
    process.exit(0);
  }

  const sampleProviders = [
    {
      provider_id: 3001,
      user_id: providerUsers[0].user_id,
      business_name: 'Cinnamon Grand Colombo',
      business_type: 'Hotel',
      status: 'Active',
      is_active: 1,
      city: 'Colombo',
      average_rating: 4.8,
      rating_count: 120,
      image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'
    },
    {
      provider_id: 3002,
      user_id: providerUsers[1].user_id,
      business_name: 'Heritage Kandy Hotel',
      business_type: 'Hotel',
      status: 'Active',
      is_active: 1,
      city: 'Kandy',
      average_rating: 4.5,
      rating_count: 85,
      image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600'
    },
    {
      provider_id: 3003,
      user_id: providerUsers[2]?.user_id || 1000,
      business_name: 'Sampath Perera (Professional Guide)',
      business_type: 'Tour_Guide',
      status: 'Active',
      is_active: 1,
      city: 'Sigiriya',
      average_rating: 4.9,
      rating_count: 210,
      image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'
    },
    {
      provider_id: 3004,
      user_id: providerUsers[3]?.user_id || 1001,
      business_name: 'Lankan Explorer Tours',
      business_type: 'Tour_Guide',
      status: 'Active',
      is_active: 1,
      city: 'Galle',
      average_rating: 4.7,
      rating_count: 150,
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'
    }
  ];

  for (const p of sampleProviders) {
    await Provider.updateOne({ provider_id: p.provider_id }, { $set: p }, { upsert: true });
    console.log(`Upserted: ${p.business_name}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
