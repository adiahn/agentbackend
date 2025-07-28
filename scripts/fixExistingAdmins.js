const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const fixExistingAdmins = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/systemmonitor';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admin(s)`);

    for (const admin of admins) {
      console.log(`\nChecking admin: ${admin.email} (${admin.role})`);
      
      let needsUpdate = false;
      const updates = {};

      // Check and set missing fields for super admin (no business fields needed)
      if (admin.role === 'super_admin') {
        if (!admin.verified) {
          updates.verified = true;
          needsUpdate = true;
        }
        if (!admin.isActive) {
          updates.isActive = true;
          needsUpdate = true;
        }
      }

      // Check and set missing fields for regular admin
      if (admin.role === 'admin') {
        if (!admin.companyName) {
          updates.companyName = 'Default Company';
          needsUpdate = true;
        }
        if (!admin.businessRegNumber) {
          updates.businessRegNumber = `DEFAULT-${admin._id.toString().slice(-6)}`;
          needsUpdate = true;
        }
        if (!admin.businessDocument) {
          updates.businessDocument = 'https://example.com/default-doc';
          needsUpdate = true;
        }
        if (!admin.nin) {
          updates.nin = `DEFAULT-NIN-${admin._id.toString().slice(-6)}`;
          needsUpdate = true;
        }
        if (!admin.phone) {
          updates.phone = '+1234567890';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`   Updating admin with fields:`, updates);
        await Admin.findByIdAndUpdate(admin._id, updates);
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ✅ No updates needed`);
      }
    }

    console.log('\n🎉 All admin accounts have been checked and updated!');

  } catch (error) {
    console.error('❌ Error fixing admin accounts:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
fixExistingAdmins(); 