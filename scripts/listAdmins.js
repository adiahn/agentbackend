const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGO_URI = 'mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function listAdmins() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Listing all admin accounts...');
    const admins = await Admin.find({}).select('-password -verificationLog');
    
    console.log(`Found ${admins.length} admin accounts:\n`);
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. 👤 Admin Account:`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Username: ${admin.username || 'Not set'}`);
      console.log(`   🎭 Role: ${admin.role}`);
      console.log(`   ✅ Verified: ${admin.verified}`);
      console.log(`   🚫 Rejected: ${admin.rejected}`);
      console.log(`   🟢 Active: ${admin.isActive}`);
      console.log(`   🏢 Company: ${admin.companyName || 'Not set'}`);
      console.log(`   📅 Created: ${admin.createdAt.toISOString().split('T')[0]}`);
      console.log(`   🔗 Last Login: ${admin.lastLogin ? admin.lastLogin.toISOString().split('T')[0] : 'Never'}`);
      console.log('');
    });

    console.log('💡 Login Credentials:');
    console.log('   - Use the email addresses above');
    console.log('   - Passwords are hashed, so you\'ll need to know the original passwords');
    console.log('   - Try common passwords like: admin123, password, 123456, etc.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

listAdmins(); 