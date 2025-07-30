const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:admin@cluster0.9egdd2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('🔗 Testing MongoDB connection...');
  console.log('📡 URI:', MONGO_URI.replace(/\/\/admin:admin@/, '//***:***@')); // Hide credentials
  
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection status:', mongoose.connection.readyState);
    console.log('🏠 Database name:', mongoose.connection.name);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔍 Full error:', error);
  }
}

testConnection(); 