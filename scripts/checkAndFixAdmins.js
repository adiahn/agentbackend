const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGO_URI = 'mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkAndFixAdmins() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Checking existing admin accounts...');
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admin accounts`);

    for (const admin of admins) {
      console.log(`\n👤 Checking admin: ${admin.email} (Role: ${admin.role})`);
      
      let needsUpdate = false;
      const updates = {};

      // Check if super admin needs default values
      if (admin.role === 'super_admin') {
        if (!admin.verified) {
          updates.verified = true;
          needsUpdate = true;
          console.log('  ➕ Setting verified: true for super admin');
        }
        if (!admin.isActive) {
          updates.isActive = true;
          needsUpdate = true;
          console.log('  ➕ Setting isActive: true for super admin');
        }
      }

      // Check if regular admin needs business fields
      if (admin.role === 'admin') {
        if (!admin.companyName) {
          updates.companyName = 'Default Company';
          needsUpdate = true;
          console.log('  ➕ Setting companyName: Default Company');
        }
        if (!admin.businessRegNumber) {
          updates.businessRegNumber = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          needsUpdate = true;
          console.log('  ➕ Setting businessRegNumber');
        }
        if (!admin.businessDocument) {
          updates.businessDocument = 'https://example.com/default-document.pdf';
          needsUpdate = true;
          console.log('  ➕ Setting businessDocument');
        }
        if (!admin.nin) {
          updates.nin = `NIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          needsUpdate = true;
          console.log('  ➕ Setting nin');
        }
        if (!admin.phone) {
          updates.phone = `+123456789${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          needsUpdate = true;
          console.log('  ➕ Setting phone');
        }
        if (!admin.verified) {
          updates.verified = true;
          needsUpdate = true;
          console.log('  ➕ Setting verified: true');
        }
      }

      if (needsUpdate) {
        try {
          await Admin.findByIdAndUpdate(admin._id, updates);
          console.log('  ✅ Updated successfully');
        } catch (updateError) {
          console.error('  ❌ Update failed:', updateError.message);
        }
      } else {
        console.log('  ✅ No updates needed');
      }
    }

    console.log('\n🎉 Admin account check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndFixAdmins(); 