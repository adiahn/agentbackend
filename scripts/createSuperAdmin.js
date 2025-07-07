const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/systemmonitor';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists');
      console.log(`   Username: ${existingSuperAdmin.username}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      username: 'superadmin',
      email: 'admin@systemmonitor.com',
      password: 'admin123456',
      role: 'super_admin'
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully');
    console.log(`   Username: ${superAdmin.username}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: admin123456`);
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
createSuperAdmin(); 