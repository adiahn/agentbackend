const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGO_URI = 'mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function resetAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@velixify.com';
    const newPassword = 'admin123'; // This will be the new password

    console.log(`\n🔐 Resetting password for: ${email}`);
    console.log(`📝 New password will be: ${newPassword}`);

    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log('❌ Admin account not found');
      return;
    }

    console.log(`✅ Found admin: ${admin.username} (Role: ${admin.role})`);

    // Set the new password (it will be hashed by the pre-save hook)
    admin.password = newPassword;
    
    try {
      await admin.save();
      console.log('✅ Password reset successfully!');
      console.log(`\n🎯 You can now login with:`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Password: ${newPassword}`);
    } catch (saveError) {
      console.error('❌ Error saving password:', saveError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

resetAdminPassword(); 