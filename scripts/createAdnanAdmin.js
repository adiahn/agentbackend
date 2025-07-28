const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createAdnanAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/systemmonitor';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'adnan@admin.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Verified: ${existingAdmin.verified}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      
      // Update the existing admin with missing fields
      const updates = {
        companyName: 'Adnan Company',
        businessRegNumber: 'ADNAN-001',
        businessDocument: 'https://example.com/adnan-doc',
        nin: 'ADNAN-NIN-001',
        phone: '+1234567890',
        verified: true,
        isActive: true
      };
      
      await Admin.findByIdAndUpdate(existingAdmin._id, updates);
      console.log('✅ Updated existing admin with missing fields');
      process.exit(0);
    }

    // Create admin account
    const admin = new Admin({
      username: 'adnan',
      email: 'adnan@admin.com',
      password: 'admin123',
      role: 'admin',
      companyName: 'Adnan Company',
      businessRegNumber: 'ADNAN-001',
      businessDocument: 'https://example.com/adnan-doc',
      nin: 'ADNAN-NIN-001',
      phone: '+1234567890',
      verified: true,
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin account created successfully');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Verified: ${admin.verified}`);
    console.log(`   Active: ${admin.isActive}`);

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
createAdnanAdmin(); 