#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * seed-sample-data.js
 * Seeds MongoDB with beautiful sample data for tourism app
 */

require('dotenv').config();
const { connectMongo, mongoose } = require('../config/mongo');
const Attraction = require('../models/Attraction');
const Package = require('../models/Package');
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');
const BookingModel = require('../models/Booking');
const PackageAttraction = require('../models/PackageAttraction');

const sampleAttractions = [
  {
    attraction_id: 1001,
    name: 'Sigiriya Rock Fortress',
    description: 'Sigiriya, also known as Lion Rock, is an ancient rock fortress located in the northern Matale District near the town of Dambulla in the Central Province, Sri Lanka. It is a site of historical and archaeological significance that is dominated by a massive column of rock nearly 200 meters high. King Kashyapa (477 – 495 AD) built his palace on the top of this rock and decorated its sides with colorful frescoes. On a small plateau about halfway up the side of this rock, he built a gateway in the form of an enormous lion. Sigiriya is today a UNESCO listed World Heritage Site. It is one of the best-preserved examples of ancient urban planning.',
    location: 'Matale District, Central Province',
    city: 'Dambulla',
    category: 'Historical',
    entrance_fee: 4500,
    opening_hours: '7:00 AM - 5:30 PM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 1250,
    is_active: 1,
  },
  {
    attraction_id: 1002,
    name: 'Galle Dutch Fort',
    description: 'The Galle Fort, also known as the Dutch Fort, is a fortification first built by the Portuguese on the Southwestern coast of Sri Lanka. The fortifications, which are standing today, were built by the Dutch beginning in 1640. It is a UNESCO World Heritage Site and the largest remaining fortress in Asia built by European occupiers. Other landmarks in the Galle Fort include the city\'s historical Dutch Reformed Church, the Old Dutch Hospital, the Galle Lighthouse, and the Clock Tower. The fort area is now a vibrant district filled with boutique hotels, shops, and cafes.',
    location: 'Church Street, Galle Fort',
    city: 'Galle',
    category: 'Historical',
    entrance_fee: 0,
    opening_hours: 'Open 24 Hours',
    operational_status: 'Open',
    average_rating: 4.8,
    rating_count: 2100,
    is_active: 1,
  },
  {
    attraction_id: 1003,
    name: 'Temple of the Sacred Tooth Relic',
    description: 'Sri Dalada Maligawa or the Temple of the Sacred Tooth Relic is a Buddhist temple in the city of Kandy, Sri Lanka. It is located in the royal palace complex of the former Kingdom of Kandy, which houses the relic of the tooth of the Buddha. Since ancient times, the relic has played an important role in local politics because it is believed that whoever holds the relic holds the governance of the country. Kandy was the last capital of the Sri Lankan kings and is a World Heritage Site mainly due to the temple.',
    location: 'Royal Palace Complex, Kandy',
    city: 'Kandy',
    category: 'Religious',
    entrance_fee: 1500,
    opening_hours: '5:30 AM - 8:00 PM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 3400,
    is_active: 1,
  },
  {
    attraction_id: 1004,
    name: 'Cultural Arts Museum',
    description: 'World-class museum showcasing traditional crafts, paintings, and cultural artifacts.',
    location: 'Museum Avenue, Cultural District',
    city: 'Art City',
    category: 'Cultural',
    entrance_fee: 10,
    opening_hours: '9:00 AM - 6:00 PM',
    operational_status: 'Open',
    average_rating: 4.5,
    rating_count: 198,
    is_active: 1,
  },
  {
    attraction_id: 1005,
    name: 'Wildlife Safari Park',
    description: 'Thrilling safari experience with lions, elephants, giraffes, and other exotic animals.',
    location: 'National Park Road, Wildlife Reserve',
    city: 'Safari Town',
    category: 'Wildlife',
    entrance_fee: 25,
    opening_hours: '6:00 AM - 7:00 PM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 612,
    is_active: 1,
  },
  {
    attraction_id: 1006,
    name: 'Adventure Park Extreme',
    description: 'Adrenaline-pumping activities including zip-lining, rock climbing, and rope courses.',
    location: 'Forest Edge, Adventure Zone',
    city: 'Thrill City',
    category: 'Adventure',
    entrance_fee: 20,
    opening_hours: '9:00 AM - 5:00 PM',
    operational_status: 'Open',
    average_rating: 4.4,
    rating_count: 156,
    is_active: 1,
  },
  {
    attraction_id: 1007,
    name: 'Grand Cathedral',
    description: 'Magnificent religious structure with stunning architecture and spiritual significance.',
    location: 'Cathedral Square, Downtown',
    city: 'Historic City',
    category: 'Religious',
    entrance_fee: 2,
    opening_hours: '7:00 AM - 9:00 PM',
    operational_status: 'Open',
    average_rating: 4.8,
    rating_count: 445,
    is_active: 1,
  },
  {
    attraction_id: 1008,
    name: 'Modern Art District',
    description: 'Vibrant urban district with street art, galleries, shopping, and dining experiences.',
    location: 'Arts Lane, City Center',
    city: 'Art City',
    category: 'Urban',
    entrance_fee: 0,
    opening_hours: '9:00 AM - 11:00 PM',
    operational_status: 'Open',
    average_rating: 4.3,
    rating_count: 289,
    is_active: 1,
  },
];

const samplePackages = [
  {
    package_id: 2001,
    provider_id: 3001,
    title: 'Southern Beach Escape - 3 Days',
    description: 'A relaxing getaway to the golden beaches of Southern Sri Lanka. Explore the historic Galle Fort and enjoy the vibrant coastal life.',
    price_per_person: 45000,
    package_type: 'Leisure',
    duration_days: 3,
    is_active: 1,
  },
  {
    package_id: 2002,
    provider_id: 3002,
    title: 'Hill Country Adventure',
    description: 'Trek through the misty mountains of Sri Lanka. Visit the iconic Sigiriya Rock and experience adrenaline-pumping activities.',
    price_per_person: 65000,
    package_type: 'Adventure',
    duration_days: 5,
    is_active: 1,
  },
  {
    package_id: 2003,
    provider_id: 3001,
    title: 'Wild Sri Lanka Safari',
    description: 'Get up close with majestic elephants and elusive leopards in our premier wildlife sanctuary. A must for nature lovers.',
    price_per_person: 85000,
    package_type: 'Wildlife',
    duration_days: 4,
    is_active: 1,
  },
  {
    package_id: 2004,
    provider_id: 3003,
    title: 'Ancient Kingdoms Heritage Tour',
    description: 'Journey back in time to the sacred city of Kandy and the ancient fortress of Sigiriya. Discover the rich history of Sri Lanka.',
    price_per_person: 55000,
    package_type: 'Cultural',
    duration_days: 3,
    is_active: 1,
  },
  {
    package_id: 2005,
    provider_id: 3002,
    title: 'Ultimate Extreme Adventure',
    description: 'Zip-lining, rock climbing, and more. This package is designed for the ultimate adrenaline junkie looking for a thrill.',
    price_per_person: 40000,
    package_type: 'Adventure',
    duration_days: 2,
    is_active: 1,
  },
  {
    package_id: 2006,
    provider_id: 3001,
    title: 'Romantic Tropical Honeymoon',
    description: 'A perfect blend of history and luxury. Spend romantic evenings at the Galle Fort and enjoy a private safari experience.',
    price_per_person: 120000,
    package_type: 'Leisure',
    duration_days: 5,
    is_active: 1,
  },
];

const samplePackageAttractions = [
  // Beach Escape
  { id: 1, package_id: 2001, attraction_id: 1002, visit_day: 1 },
  { id: 2, package_id: 2001, attraction_id: 1008, visit_day: 2 },
  // Hill Country
  { id: 3, package_id: 2002, attraction_id: 1001, visit_day: 1 },
  { id: 4, package_id: 2002, attraction_id: 1006, visit_day: 2 },
  // Wildlife
  { id: 5, package_id: 2003, attraction_id: 1005, visit_day: 1 },
  // Heritage
  { id: 6, package_id: 2004, attraction_id: 1003, visit_day: 1 },
  { id: 7, package_id: 2004, attraction_id: 1001, visit_day: 2 },
  { id: 8, package_id: 2004, attraction_id: 1007, visit_day: 3 },
  // Extreme
  { id: 9, package_id: 2005, attraction_id: 1006, visit_day: 1 },
  // Honeymoon
  { id: 10, package_id: 2006, attraction_id: 1002, visit_day: 1 },
  { id: 11, package_id: 2006, attraction_id: 1005, visit_day: 3 },
];

const sampleProviders = [
  {
    provider_id: 3001,
    business_name: 'Paradise Tours & Travels',
    business_type: 'Tour_Operator',
    description: 'Leading tour operator with 15+ years experience',
    city: 'Colombo',
    is_active: 1,
    status: 'Active',
  },
  {
    provider_id: 3002,
    business_name: 'Adventure Seekers SL',
    business_type: 'Tour_Operator',
    description: 'Specializing in adventure and extreme sports tourism',
    city: 'Kandy',
    is_active: 1,
    status: 'Active',
  },
  {
    provider_id: 3003,
    business_name: 'Heritage Explorers',
    business_type: 'Tour_Operator',
    description: 'Cultural and heritage tourism experts',
    city: 'Galle',
    is_active: 1,
    status: 'Active',
  },
  // Hotels
  {
    provider_id: 4001,
    business_name: 'The Grand Heritage Hotel',
    business_type: 'Hotel',
    description: 'Luxury colonial-style hotel in the heart of Kandy.',
    city: 'Kandy',
    is_active: 1,
    status: 'Active',
    average_rating: 4.8,
  },
  {
    provider_id: 4002,
    business_name: 'Ocean View Resort',
    business_type: 'Hotel',
    description: 'Beautiful beachside resort with modern amenities.',
    city: 'Galle',
    is_active: 1,
    status: 'Active',
    average_rating: 4.6,
  },
  {
    provider_id: 4003,
    business_name: 'Cinnamon Lakeside',
    business_type: 'Hotel',
    description: 'Premium city hotel with stunning lake views.',
    city: 'Colombo',
    is_active: 1,
    status: 'Active',
    average_rating: 4.9,
  },
  // Tour Guides
  {
    provider_id: 5001,
    business_name: 'Anura Kumara (Expert Guide)',
    business_type: 'Tour_Guide',
    description: 'Certified national guide with deep knowledge of history.',
    city: 'Colombo',
    is_active: 1,
    status: 'Active',
    average_rating: 4.9,
  },
  {
    provider_id: 5002,
    business_name: 'Sunil Perera (Safari Expert)',
    business_type: 'Tour_Guide',
    description: 'Specialist in wildlife and national park tours.',
    city: 'Safari Town',
    is_active: 1,
    status: 'Active',
    average_rating: 4.7,
  },
];

const sampleUsers = [
  {
    user_id: 1001,
    username: 'john_traveler',
    email: 'john@example.com',
    password: 'password123',
    role: 'Tourist',
    full_name: 'John Doe',
    phone: '+1-555-1001',
    is_active: 1,
    email_verified: 1,
  },
  {
    user_id: 1002,
    username: 'sarah_explorer',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'Tourist',
    full_name: 'Sarah Smith',
    phone: '+1-555-1002',
    is_active: 1,
    email_verified: 1,
  },
  {
    user_id: 1003,
    username: 'admin',
    email: 'admin@tourism.lk',
    password: 'Admin@123',
    role: 'Admin',
    full_name: 'System Admin',
    phone: '+94 77 123 4567',
    is_active: 1,
    email_verified: 1,
  },
  // Requested Users
  {
    user_id: 1004,
    username: 'amara_perera',
    email: 'amara.perera@gmail.com',
    password: 'Tourist@123',
    role: 'Tourist',
    full_name: 'Amara Perera',
    is_active: 1,
  },
  {
    user_id: 1005,
    username: 'kasun_fernando',
    email: 'kasun.fernando@gmail.com',
    password: 'Tourist@123',
    role: 'Tourist',
    full_name: 'Kasun Fernando',
    is_active: 1,
  },
  {
    user_id: 1006,
    username: 'nimal_resort',
    email: 'nimal@serenityresort.lk',
    password: 'Provider@123',
    role: 'Service_Provider',
    full_name: 'Nimal (Serenity Resort)',
    is_active: 1,
  },
  {
    user_id: 1007,
    username: 'dilini_travels',
    email: 'dilini@lankatravels.lk',
    password: 'Provider@123',
    role: 'Service_Provider',
    full_name: 'Dilini (Lanka Travels)',
    is_active: 1,
  },
  {
    user_id: 1008,
    username: 'rajitha_tours',
    email: 'rajitha@heritagetours.lk',
    password: 'Provider@123',
    role: 'Service_Provider',
    full_name: 'Rajitha (Heritage Tours)',
    is_active: 1,
  },
  {
    user_id: 1009,
    username: 'priya_agent',
    email: 'priya.agent@tourism.lk',
    password: 'Agent@123',
    role: 'Support_Agent',
    full_name: 'Priya Support',
    is_active: 1,
  },
  {
    user_id: 1010,
    username: 'chaminda_authority',
    email: 'chaminda@sltda.lk',
    password: 'Agent@123',
    role: 'Authority',
    full_name: 'Chaminda Authority',
    is_active: 1,
  },
];

async function seedData() {
  try {
    await connectMongo();
    console.log('🌱 Starting seed process...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Attraction.deleteMany({});
    await Package.deleteMany({});
    await ServiceProvider.deleteMany({});
    await User.deleteMany({});
    await PackageAttraction.deleteMany({});

    // Insert sample data
    console.log('📝 Inserting sample attractions...');
    const attractions = await Attraction.insertMany(sampleAttractions);
    console.log(`✅ Inserted ${attractions.length} attractions\n`);

    console.log('📝 Inserting sample providers...');
    const providers = await ServiceProvider.insertMany(sampleProviders);
    console.log(`✅ Inserted ${providers.length} providers\n`);

    console.log('📝 Inserting sample packages...');
    const packages = await Package.insertMany(samplePackages);
    console.log(`✅ Inserted ${packages.length} packages\n`);

    console.log('📝 Inserting sample users...');
    const bcrypt = require('bcryptjs');
    const processedUsers = await Promise.all(sampleUsers.map(async (u) => {
      if (u.password) {
        const { password, ...rest } = u;
        rest.password_hash = await bcrypt.hash(password, 10);
        return rest;
      }
      return u;
    }));
    const users = await User.insertMany(processedUsers);
    console.log(`✅ Inserted ${users.length} users\n`);

    console.log('📝 Linking attractions to packages...');
    const links = await PackageAttraction.insertMany(samplePackageAttractions);
    console.log(`✅ Inserted ${links.length} itinerary links\n`);

    // Display summary
    console.log('═══════════════════════════════════════');
    console.log('✨ SEED DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`🏛️  Attractions: ${attractions.length}`);
    console.log(`📦 Packages: ${packages.length}`);
    console.log(`🏢 Providers: ${providers.length}`);
    console.log(`👥 Users: ${users.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedData();
