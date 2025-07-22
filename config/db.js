const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/systemmonitor';
    
    if (!process.env.MONGO_URI) {
      console.warn('⚠️  No MONGO_URI found in environment variables. Using local MongoDB.');
      console.warn('   To use MongoDB Atlas, set MONGO_URI in your .env file.');
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 To fix this:');
    console.log('   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
    console.log('   2. Or set up MongoDB Atlas and update MONGO_URI in .env file');
    console.log('   3. Or comment out the connectDB() call in index.js for development without DB');
    
    // Don't exit the process, let the server run without DB for development
    console.log('🔄 Continuing without database connection...');
  }
};

module.exports = connectDB; 