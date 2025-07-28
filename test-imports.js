// Test script to verify all imports are working
console.log('Testing imports...');

try {
  console.log('✅ Testing basic dependencies...');
  require('express');
  require('mongoose');
  require('bcryptjs');
  require('jsonwebtoken');
  require('express-validator');
  require('cors');
  require('dotenv');
  require('cloudinary');
  require('multer');
  require('multer-storage-cloudinary');
  require('uuid');
  console.log('✅ All basic dependencies imported successfully');

  console.log('✅ Testing local modules...');
  require('./models/Admin');
  require('./models/AccessRequest');
  require('./controllers/authController');
  require('./controllers/adminController');
  require('./middleware/auth');
  require('./middleware/validation');
  require('./routes/authRoutes');
  require('./routes/adminRoutes');
  console.log('✅ All local modules imported successfully');

  console.log('✅ Testing configuration...');
  require('./config/db');
  require('./config/cloudinary');
  console.log('✅ All configuration modules imported successfully');

  console.log('🎉 All imports successful! The application should deploy without issues.');
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
} 