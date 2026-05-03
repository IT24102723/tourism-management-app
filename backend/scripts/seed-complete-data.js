#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * seed-complete-data.js
 * Seeds MongoDB with complete test data including all user roles
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectMongo, mongoose } = require('../config/mongo');
const Attraction = require('../models/Attraction');
const AttractionImage = require('../models/AttractionImage');
const Package = require('../models/Package');
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');
const TransportVehicle = require('../models/TransportVehicle');
const Inquiry = require('../models/Inquiry');

// Sample Attraction Images - Sri Lankan Locations (Using Unsplash URLs)
const sampleAttractionImages = [
  // Mirissa Beach
  { attraction_id: 1001, image_id: 1, image_url: 'https://www.walkmyworld.com/posts/best-things-to-do-in-mirissa-beach-and-the-south-coast-of-sri-lanka},
  { attraction_id: 1001, image_id: 2, image_url: 'https://www.walkmyworld.com/posts/best-things-to-do-in-mirissa-beach-and-the-south-coast-of-sri-lanka', caption: 'Beach waves', is_primary: 0 },

  // Adam's Peak
  { attraction_id: 1002, image_id: 3, image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', caption: 'Adam\'s Peak summit', is_primary: 1 },
  { attraction_id: 1002, image_id: 4, image_url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=400&fit=crop', caption: 'Mountain landscape', is_primary: 0 },

  // Sigiriya Rock
  { attraction_id: 1003, image_id: 5, image_url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=400&fit=crop', caption: 'Sigiriya Rock Fortress', is_primary: 1 },
  { attraction_id: 1003, image_id: 6, image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', caption: 'Rock formations', is_primary: 0 },

  // Kandy Temple
  { attraction_id: 1004, image_id: 7, image_url: 'https://images.unsplash.com/photo-1548013146-72e1e39dc227?w=600&h=400&fit=crop', caption: 'Kandy Temple of the Tooth', is_primary: 1 },
  { attraction_id: 1004, image_id: 8, image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop', caption: 'Temple architecture', is_primary: 0 },

  // Yala Safari
  { attraction_id: 1005, image_id: 9, image_url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&h=400&fit=crop', caption: 'Wildlife safari leopard', is_primary: 1 },
  { attraction_id: 1005, image_id: 10, image_url: 'https://images.unsplash.com/photo-1516426122078-823edac584ad?w=600&h=400&fit=crop', caption: 'Safari animals', is_primary: 0 },

  // Tea Plantations
  { attraction_id: 1006, image_id: 11, image_url: 'https://images.unsplash.com/photo-1545665225-d8d2a6b8c7d0?w=600&h=400&fit=crop', caption: 'Tea plantations highlands', is_primary: 1 },
  { attraction_id: 1006, image_id: 12, image_url: 'https://images.unsplash.com/photo-1516426122078-8023edac584ad?w=600&h=400&fit=crop', caption: 'Tea fields landscape', is_primary: 0 },

  // Old Parliament
  { attraction_id: 1007, image_id: 13, image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop', caption: 'Parliament building architecture', is_primary: 1 },
  { attraction_id: 1007, image_id: 14, image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', caption: 'Historic building', is_primary: 0 },

  // Galle Fort
  { attraction_id: 1008, image_id: 15, image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', caption: 'Galle Fort walls', is_primary: 1 },
  { attraction_id: 1008, image_id: 16, image_url: 'https://images.unsplash.com/photo-1583880527921-71d0f82dc81b?w=600&h=400&fit=crop', caption: 'Fort coastal views', is_primary: 0 },
];

// Sample Attractions Data - Sri Lankan Locations
const sampleAttractions = [
  {
    attraction_id: 1001,
    name: 'Mirissa Beach',
    description: 'Beautiful sandy beach in the south coast with crystal clear waters, perfect for swimming and whale watching.',
    location: 'Mirissa, Matara District',
    city: 'Matara',
    category: 'Beach',
    entrance_fee: 0,
    opening_hours: '6:00 AM - 10:00 PM',
    operational_status: 'Open',
    average_rating: 4.8,
    rating_count: 342,
    is_active: 1,
  },
  {
    attraction_id: 1002,
    name: 'Adam\'s Peak (Sri Pada)',
    description: 'Sacred mountain with 5,243 steps leading to the summit. Breathtaking views and hiking trails in the central highlands.',
    location: 'Nuwara Eliya District',
    city: 'Nuwara Eliya',
    category: 'Mountain',
    entrance_fee: 1500,
    opening_hours: '12:00 AM - 6:00 AM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 512,
    is_active: 1,
  },
  {
    attraction_id: 1003,
    name: 'Sigiriya Rock Fortress',
    description: 'Ancient rock fortress (5th century) with stunning views. A UNESCO World Heritage Site with rock paintings and gardens.',
    location: 'Sigiriya, Matale District',
    city: 'Matale',
    category: 'Historical',
    entrance_fee: 4600,
    opening_hours: '7:00 AM - 5:00 PM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 827,
    is_active: 1,
  },
  {
    attraction_id: 1004,
    name: 'Kandy Temple of the Tooth',
    description: 'The most sacred Buddhist temple in Sri Lanka, housing the tooth relic of Buddha. Stunning architecture and cultural significance.',
    location: 'Kandy City Center',
    city: 'Kandy',
    category: 'Religious',
    entrance_fee: 1500,
    opening_hours: '5:30 AM - 8:00 PM',
    operational_status: 'Open',
    average_rating: 4.8,
    rating_count: 672,
    is_active: 1,
  },
  {
    attraction_id: 1005,
    name: 'Yala National Park',
    description: 'One of Asia\'s best wildlife reserves. Spot leopards, elephants, sloth bears, and exotic birds on thrilling safari drives.',
    location: 'Tissamaharama, Matara District',
    city: 'Tissamaharama',
    category: 'Wildlife',
    entrance_fee: 3500,
    opening_hours: '6:00 AM - 6:00 PM',
    operational_status: 'Open',
    average_rating: 4.9,
    rating_count: 445,
    is_active: 1,
  },
  {
    attraction_id: 1006,
    name: 'Tea Plantations - Nuwara Eliya',
    description: 'Lush green tea estates in the misty highlands. Experience tea picking, factory tours, and stunning mountain scenery.',
    location: 'Nanu Oya, Nuwara Eliya',
    city: 'Nuwara Eliya',
    category: 'Adventure',
    entrance_fee: 1000,
    opening_hours: '8:00 AM - 5:00 PM',
    operational_status: 'Open',
    average_rating: 4.7,
    rating_count: 289,
    is_active: 1,
  },
  {
    attraction_id: 1007,
    name: 'Old Parliament Building - Colombo',
    description: 'Historic colonial architecture in the heart of Colombo. A UNESCO World Heritage Site showcasing Sri Lanka\'s political history.',
    location: 'Colombo 3, Western Province',
    city: 'Colombo',
    category: 'Historical',
    entrance_fee: 500,
    opening_hours: '9:00 AM - 5:00 PM',
    operational_status: 'Open',
    average_rating: 4.5,
    rating_count: 156,
    is_active: 1,
  },
  {
    attraction_id: 1008,
    name: 'Galle Fort',
    description: 'UNESCO World Heritage Site - Well-preserved 17th-century fort with Dutch, British, and French influences. Coastal views and historic charm.',
    location: 'Galle, Southern Province',
    city: 'Galle',
    category: 'Historical',
    entrance_fee: 1500,
    opening_hours: '6:00 AM - 8:00 PM',
    operational_status: 'Open',
    average_rating: 4.8,
    rating_count: 534,
    is_active: 1,
  },
];

// Sample Packages Data - Sri Lankan Tours in LKR
const samplePackages = [
  {
    package_id: 2001,
    provider_id: 3001,
    name: 'South Coast Beach Escape',
    description: 'Relax on pristine beaches in Mirissa & Unawatuna. Includes whale watching, snorkeling, and sunset views.',
    price: 24999,
    package_type: 'Leisure',
    duration_days: 3,
    is_active: true,
  },
  {
    package_id: 2002,
    provider_id: 3002,
    name: 'Central Highlands Adventure',
    description: 'Trek Adam\'s Peak, explore tea plantations, and visit Kandy temple. 5 days of unforgettable mountain experiences.',
    price: 59999,
    package_type: 'Adventure',
    duration_days: 5,
    is_active: true,
  },
  {
    package_id: 2003,
    provider_id: 3001,
    name: 'Wildlife Safari - Yala Experience',
    description: '4-day safari in Yala National Park. Spot leopards, elephants, and exotic birds. All-inclusive with lodge accommodation.',
    price: 89999,
    package_type: 'Wildlife',
    duration_days: 4,
    is_active: true,
  },
  {
    package_id: 2004,
    provider_id: 3003,
    name: 'Cultural Heritage Tour',
    description: 'Visit Sigiriya, Kandy Temple of the Tooth, and Galle Fort. Immerse yourself in Sri Lankan history and culture.',
    price: 34999,
    package_type: 'Cultural',
    duration_days: 3,
    is_active: true,
  },
  {
    package_id: 2005,
    provider_id: 3002,
    name: 'Grand Sri Lanka Circle Tour',
    description: 'Complete island experience: beaches, mountains, wildlife, and culture. 7-day comprehensive tour covering all regions.',
    price: 129999,
    package_type: 'Adventure',
    duration_days: 7,
    is_active: true,
  },
  {
    package_id: 2006,
    provider_id: 3001,
    name: 'Honeymoon Paradise - 5 Days',
    description: 'Romantic 5-day getaway with private villa stay, sunset beach dinners, and couple spa treatments.',
    price: 249999,
    package_type: 'Leisure',
    duration_days: 5,
    is_active: true,
  },
];

// Sample Providers Data
const sampleProviders = [
  {
    provider_id: 3001,
    name: 'Paradise Tours',
    email: 'nimal@serenityresort.lk',
    phone: '+94-701-234567',
    description: 'Leading tour operator with 15+ years experience',
    is_active: 1,
    status: 'verified',
  },
  {
    provider_id: 3002,
    name: 'Adventure Seekers',
    email: 'dilini@lankatravels.lk',
    phone: '+94-702-345678',
    description: 'Specializing in adventure and extreme sports tourism',
    is_active: 1,
    status: 'verified',
  },
  {
    provider_id: 3003,
    name: 'Heritage Explorers',
    email: 'rajitha@heritagetours.lk',
    phone: '+94-703-456789',
    description: 'Cultural and heritage tourism experts',
    is_active: 1,
    status: 'verified',
  },
];

// Sample Transport Vehicles Data
const sampleVehicles = [
  {
    vehicle_id: 4001,
    provider_id: 3001,
    vehicle_type: 'Bus',
    license_plate: 'WP-CA-1234',
    capacity: 45,
    rental_price_per_day: 150,
    is_available: 1,
    condition_status: 'Excellent',
    created_at: new Date(),
  },
  {
    vehicle_id: 4002,
    provider_id: 3001,
    vehicle_type: 'Van',
    license_plate: 'WP-CA-5678',
    capacity: 12,
    rental_price_per_day: 80,
    is_available: 1,
    condition_status: 'Good',
    created_at: new Date(),
  },
  {
    vehicle_id: 4003,
    provider_id: 3002,
    vehicle_type: 'Bus',
    license_plate: 'WP-CB-9012',
    capacity: 50,
    rental_price_per_day: 180,
    is_available: 1,
    condition_status: 'Excellent',
    created_at: new Date(),
  },
  {
    vehicle_id: 4004,
    provider_id: 3002,
    vehicle_type: 'Jeep',
    license_plate: 'WP-CB-3456',
    capacity: 6,
    rental_price_per_day: 120,
    is_available: 1,
    condition_status: 'Good',
    created_at: new Date(),
  },
  {
    vehicle_id: 4005,
    provider_id: 3003,
    vehicle_type: 'Van',
    license_plate: 'WP-CC-7890',
    capacity: 15,
    rental_price_per_day: 100,
    is_available: 1,
    condition_status: 'Good',
    created_at: new Date(),
  },
];

// Sample Inquiries Data
const sampleInquiries = [
  {
    inquiry_id: 5001,
    user_id: 1001,
    subject: 'Beach Package Customization',
    message: 'Can we customize the beach escape package for our family of 6?',
    status: 'Pending',
    inquiry_type: 'Package_Inquiry',
    created_at: new Date(),
  },
  {
    inquiry_id: 5002,
    user_id: 1002,
    subject: 'Safari Group Discount',
    message: 'What group discounts are available for 15 people?',
    status: 'Pending',
    inquiry_type: 'Pricing_Inquiry',
    created_at: new Date(),
  },
  {
    inquiry_id: 5003,
    user_id: 1001,
    subject: 'Transport Availability',
    message: 'Do you have transport available for December holidays?',
    status: 'Pending',
    inquiry_type: 'Transport_Inquiry',
    created_at: new Date(),
  },
];

// Helper to hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Complete Users Data with all roles
async function generateUsers() {
  const salt = 10;

  return [
    // Tourists
    {
      user_id: 1001,
      username: 'amara.perera',
      email: 'amara.perera@gmail.com',
      password_hash: await hashPassword('Tourist@123'),
      role: 'Tourist',
      full_name: 'Amara Perera',
      phone: '+94-701-111111',
      is_active: 1,
      email_verified: 1,
    },
    {
      user_id: 1002,
      username: 'kasun.fernando',
      email: 'kasun.fernando@gmail.com',
      password_hash: await hashPassword('Tourist@123'),
      role: 'Tourist',
      full_name: 'Kasun Fernando',
      phone: '+94-702-222222',
      is_active: 1,
      email_verified: 1,
    },
    // Service Providers
    {
      user_id: 2001,
      username: 'nimal.provider',
      email: 'nimal@serenityresort.lk',
      password_hash: await hashPassword('Provider@123'),
      role: 'Service_Provider',
      full_name: 'Nimal Jayasuriya',
      phone: '+94-701-234567',
      is_active: 1,
      email_verified: 1,
    },
    {
      user_id: 2002,
      username: 'dilini.provider',
      email: 'dilini@lankatravels.lk',
      password_hash: await hashPassword('Provider@123'),
      role: 'Service_Provider',
      full_name: 'Dilini Silva',
      phone: '+94-702-345678',
      is_active: 1,
      email_verified: 1,
    },
    {
      user_id: 2003,
      username: 'rajitha.provider',
      email: 'rajitha@heritagetours.lk',
      password_hash: await hashPassword('Provider@123'),
      role: 'Service_Provider',
      full_name: 'Rajitha Wijetunga',
      phone: '+94-703-456789',
      is_active: 1,
      email_verified: 1,
    },
    // Support Agent
    {
      user_id: 3001,
      username: 'priya.agent',
      email: 'priya.agent@tourism.lk',
      password_hash: await hashPassword('Agent@123'),
      role: 'Support_Agent',
      full_name: 'Priya Dissanayake',
      phone: '+94-711-333333',
      is_active: 1,
      email_verified: 1,
    },
    // Tourism Authority
    {
      user_id: 4001,
      username: 'chaminda.auth',
      email: 'chaminda@sltda.lk',
      password_hash: await hashPassword('Agent@123'),
      role: 'Tourism_Authority',
      full_name: 'Chaminda Gunawardena',
      phone: '+94-712-444444',
      is_active: 1,
      email_verified: 1,
    },
    // Admin
    {
      user_id: 5001,
      username: 'admin',
      email: 'admin@tourism.lk',
      password_hash: await hashPassword('Admin@123'),
      role: 'Admin',
      full_name: 'System Administrator',
      phone: '+94-713-555555',
      is_active: 1,
      email_verified: 1,
    },
  ];
}

async function seedData() {
  try {
    await connectMongo();
    console.log('🌱 Starting comprehensive seed process...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Attraction.deleteMany({});
    await AttractionImage.deleteMany({});
    await Package.deleteMany({});
    await ServiceProvider.deleteMany({});
    await User.deleteMany({});
    await TransportVehicle.deleteMany({});
    await Inquiry.deleteMany({});

    // Insert attractions
    console.log('📝 Inserting sample attractions...');
    const attractions = await Attraction.insertMany(sampleAttractions);
    console.log(`✅ Inserted ${attractions.length} attractions\n`);

    // Insert attraction images
    console.log('📝 Inserting attraction images...');
    const images = await AttractionImage.insertMany(sampleAttractionImages);
    console.log(`✅ Inserted ${images.length} images\n`);

    // Insert providers
    console.log('📝 Inserting service providers...');
    const providers = await ServiceProvider.insertMany(sampleProviders);
    console.log(`✅ Inserted ${providers.length} providers\n`);

    // Insert packages
    console.log('📝 Inserting tour packages...');
    const packages = await Package.insertMany(samplePackages);
    console.log(`✅ Inserted ${packages.length} packages\n`);

    // Generate and insert users with hashed passwords
    console.log('📝 Inserting test users with all roles...');
    const users = await generateUsers();
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.length} users\n`);

    // Insert transport vehicles
    console.log('📝 Inserting transport vehicles...');
    const vehicles = await TransportVehicle.insertMany(sampleVehicles);
    console.log(`✅ Inserted ${vehicles.length} vehicles\n`);

    // Insert inquiries
    console.log('📝 Inserting sample inquiries...');
    const inquiries = await Inquiry.insertMany(sampleInquiries);
    console.log(`✅ Inserted ${inquiries.length} inquiries\n`);

    // Display summary
    console.log('═══════════════════════════════════════');
    console.log('✨ COMPLETE SEED DATA SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`🏛️  Attractions: ${attractions.length}`);
    console.log(`�️  Images: ${images.length}`);
    console.log(`�📦 Packages: ${packages.length}`);
    console.log(`🏢 Providers: ${providers.length}`);
    console.log(`👥 Users: ${insertedUsers.length}`);
    console.log(`🚗 Vehicles: ${vehicles.length}`);
    console.log(`💬 Inquiries: ${inquiries.length}`);
    console.log('═══════════════════════════════════════\n');

    // Display test credentials
    console.log('🔐 TEST CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('👤 TOURIST:');
    console.log('   📧 amara.perera@gmail.com | 🔑 Tourist@123');
    console.log('   📧 kasun.fernando@gmail.com | 🔑 Tourist@123\n');
    console.log('🏢 SERVICE PROVIDER:');
    console.log('   📧 nimal@serenityresort.lk | 🔑 Provider@123');
    console.log('   📧 dilini@lankatravels.lk | 🔑 Provider@123');
    console.log('   📧 rajitha@heritagetours.lk | 🔑 Provider@123\n');
    console.log('💬 SUPPORT AGENT:');
    console.log('   📧 priya.agent@tourism.lk | 🔑 Agent@123\n');
    console.log('🏛️  TOURISM AUTHORITY:');
    console.log('   📧 chaminda@sltda.lk | 🔑 Agent@123\n');
    console.log('🔧 ADMIN:');
    console.log('   📧 admin@tourism.lk | 🔑 Admin@123');
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Comprehensive seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedData();
