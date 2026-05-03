#!/usr/bin/env node
/**
 * create-test-user.js
 * Creates a test user for login testing
 * Usage: node scripts/create-test-user.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectMongo } = require('../config/mongo');
const { User } = require('../models');

async function createTestUser() {
  try {
    await connectMongo();
    console.log('📝 Creating test user...\n');

    // Check if test user already exists
    const existing = await User.findOne({ email: 'test@example.com' });
    if (existing) {
      console.log('✅ Test user already exists!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Password: test123Test (for login testing)`);
      process.exit(0);
    }

    // Hash password: test123Test
    const password_hash = await bcrypt.hash('test123Test', 12);

    // Get next user_id
    const lastUser = await User.findOne({}, { user_id: 1 }).sort({ user_id: -1 });
    const user_id = (lastUser?.user_id || 0) + 1;

    // Create test user
    const testUser = await User.create({
      user_id,
      username: 'test_user',
      email: 'test@example.com',
      password_hash,
      role: 'Tourist',
      full_name: 'Test User',
      phone: '+1-555-0001',
      is_active: 1,
      email_verified: 1,
    });

    console.log('✅ Test user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log(`   Email:    test@example.com`);
    console.log(`   Password: test123Test`);
    console.log('\n🚀 Use these credentials to login in the mobile app\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating test user:', err.message);
    process.exit(1);
  }
}

createTestUser();
