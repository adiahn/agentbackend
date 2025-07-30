const axios = require('axios');

async function testSpecificLogin() {
  try {
    console.log('🧪 Testing specific login...');
    
    const loginData = {
      email: 'admin@velixify.com',
      password: 'admin123'
    };

    console.log('📤 Sending login request...');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);

    const response = await axios.post('https://agentbackend-kpdd.vercel.app/api/admin/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');
    console.log('👤 Admin role:', response.data.admin.role);
    console.log('✅ Verified:', response.data.admin.verified);
    console.log('🟢 Active:', response.data.admin.isActive);

    // Test analytics endpoint with the token
    console.log('\n🧪 Testing analytics endpoint with token...');
    const token = response.data.token;
    
    const analyticsResponse = await axios.get('https://agentbackend-kpdd.vercel.app/api/analytics/super/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    console.log('✅ Analytics endpoint working!');
    console.log('📊 Status:', analyticsResponse.status);
    console.log('📈 Data received:', Object.keys(analyticsResponse.data));

  } catch (error) {
    console.error('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📝 Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSpecificLogin(); 