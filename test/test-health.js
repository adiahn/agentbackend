const axios = require('axios');

async function testHealth() {
  try {
    console.log('🏥 Testing Health Endpoint...');
    const response = await axios.get('https://agentbackend-kpdd.vercel.app/api/health');
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.database) {
      console.log('🔗 Database Connected:', response.data.database.connected);
      console.log('📈 Database Status:', response.data.database.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📝 Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testHealth(); 