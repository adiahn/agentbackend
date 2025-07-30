const axios = require('axios');

const BASE_URL = 'https://agentbackend-kpdd.vercel.app';

// Test the specific endpoints that are giving 500 errors
const test500ErrorEndpoints = async () => {
  console.log('🧪 Testing 500 Error Endpoints...\n');

  const endpoints = [
    '/api/analytics/super/alerts?limit=10',
    '/api/analytics/super/overview',
    '/api/analytics/super/top-agents?limit=5',
    '/api/admin/access-requests/stats',
    '/api/analytics/overview',
    '/api/analytics/agent-activity?period=7d&granularity=daily',
    '/api/activation/my-codes?status=active',
    '/api/activation/my-codes?status=inActive'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.code}`);
      console.log(`📝 Details: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log(`🔍 Full Error Response:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('---\n');
  }
};

// Test with authentication token
const testWithAuth = async () => {
  console.log('🔐 Testing with Authentication...\n');
  
  try {
    // First, login to get a token
    console.log('Logging in to get token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
      email: 'adnan@admin.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log(`✅ Login successful, got token: ${token.substring(0, 20)}...`);
    
    // Test super admin endpoints with token
    const superAdminEndpoints = [
      '/api/analytics/super/alerts?limit=10',
      '/api/analytics/super/overview',
      '/api/analytics/super/top-agents?limit=5'
    ];
    
    for (const endpoint of superAdminEndpoints) {
      try {
        console.log(`Testing with auth: ${endpoint}`);
        
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.response?.status || error.code}`);
        console.log(`📝 Details: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
        
        if (error.response?.data) {
          console.log(`🔍 Full Error Response:`, JSON.stringify(error.response.data, null, 2));
        }
      }
      console.log('---\n');
    }
    
  } catch (error) {
    console.log(`❌ Login failed: ${error.response?.status || error.message}`);
  }
};

// Test database connection specifically
const testDatabaseConnection = async () => {
  console.log('🏥 Testing Database Connection...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Health Status: ${response.status}`);
    console.log(`📊 Database Status:`, response.data.database);
    console.log(`🔗 Connected: ${response.data.database.connected}`);
    
    if (!response.data.database.connected) {
      console.log('🚨 DATABASE IS NOT CONNECTED! This is causing the 500 errors.');
      console.log('💡 You need to set the MONGO_URI environment variable in Vercel.');
    }
    
  } catch (error) {
    console.log(`❌ Health Check Error: ${error.response?.status || error.message}`);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting 500 Error Debug Tests...\n');
  
  await testDatabaseConnection();
  await test500ErrorEndpoints();
  await testWithAuth();
  
  console.log('\n✅ Debug tests completed!');
};

runTests().catch(console.error); 