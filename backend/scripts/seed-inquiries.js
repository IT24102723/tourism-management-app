// scripts/seed-inquiries.js - Create test inquiry data
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { Inquiry, InquiryResponse, User } = require('../models');
const { getNextNumericId } = require('../utils/mongoIds');

async function seedInquiries() {
  try {
    console.log('🌱 Starting inquiry seed...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing inquiries (optional - comment out if you want to keep existing)
    // await Inquiry.deleteMany({});
    // await InquiryResponse.deleteMany({});

    // Get or create test users
    let testUser = await User.findOne({ username: 'tourist1' });
    if (!testUser) {
      testUser = await User.create({
        user_id: 101,
        username: 'tourist1',
        email: 'tourist@example.com',
        role: 'Tourist',
        is_active: 1,
        created_at: new Date(),
      });
      console.log('✅ Created test user');
    }

    let adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      adminUser = await User.create({
        user_id: 999,
        username: 'admin',
        email: 'admin@example.com',
        role: 'Admin',
        is_active: 1,
        created_at: new Date(),
      });
      console.log('✅ Created admin user');
    }

    // Create test inquiries
    const testInquiries = [
      {
        subject: 'Payment issue with booking',
        message: 'I was charged twice for my package booking. Please help me resolve this.',
        category: 'Payment',
        priority: 'High',
        status: 'Submitted',
      },
      {
        subject: 'Question about Sigiriya tour',
        message: 'What is included in the Sigiriya Rock Heritage Package?',
        category: 'General',
        priority: 'Medium',
        status: 'Submitted',
      },
      {
        subject: 'Booking confirmation not received',
        message: 'I completed my booking but haven\'t received a confirmation email.',
        category: 'Booking',
        priority: 'High',
        status: 'Pending',
      },
      {
        subject: 'Complaint about tour guide',
        message: 'The tour guide was unprofessional and didn\'t follow the itinerary.',
        category: 'Complaint',
        priority: 'High',
        status: 'Responded',
      },
      {
        subject: 'Suggest new tour package',
        message: 'I would like to suggest adding a night safari package for wildlife tours.',
        category: 'Suggestion',
        priority: 'Low',
        status: 'Submitted',
      },
      {
        subject: 'Technical issue with app',
        message: 'The payment page keeps crashing when I try to proceed. I\'m using Android.',
        category: 'Technical',
        priority: 'High',
        status: 'Pending',
      },
    ];

    for (const inquiryData of testInquiries) {
      const inquiry_id = await getNextNumericId(Inquiry, 'inquiry_id');
      const inquiry = await Inquiry.create({
        inquiry_id,
        user_id: testUser.user_id,
        assigned_agent_id: inquiryData.status === 'Responded' ? adminUser.user_id : null,
        subject: inquiryData.subject,
        message: inquiryData.message,
        category: inquiryData.category,
        priority: inquiryData.priority,
        status: inquiryData.status,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Add a response to the "Responded" inquiry
      if (inquiryData.status === 'Responded') {
        const response_id = await getNextNumericId(InquiryResponse, 'response_id');
        await InquiryResponse.create({
          response_id,
          inquiry_id: inquiry.inquiry_id,
          responder_id: adminUser.user_id,
          message: 'Thank you for your inquiry. We have reviewed your complaint and will contact you shortly.',
          created_at: new Date(),
        });
        console.log(`✅ Created inquiry #${inquiry_id} with response`);
      } else {
        console.log(`✅ Created inquiry #${inquiry_id}`);
      }
    }

    console.log('🌱 Inquiry seeding complete!');
    console.log('📨 You now have 6 test inquiries to work with:');
    console.log('   - 2 Submitted inquiries');
    console.log('   - 2 Pending inquiries');
    console.log('   - 1 Responded inquiry');
    console.log('   - Various categories for filtering');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding inquiries:', err.message);
    process.exit(1);
  }
}

seedInquiries();
