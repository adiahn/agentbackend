const axios = require('axios');

const BASE_URL = 'https://agentbackend-kpdd.vercel.app';

// Test login with different scenarios
const testLogin = async () => {
  console.log('🧪 Testing Login Endpoint...\n');

  const testCases = [
    {
      name: 'Super Admin Login',
      data: {
        email: 'admin@systemmonitor.com',
        password: 'admin123456'
      }
    },
    {
      name: 'Regular Admin Login',
      data: {
        email: 'adnan@admin.com',
        password: 'admin123'
      }
    },
    {
      name: 'Invalid Email',
      data: {
        email: 'nonexistent@example.com',
        password: 'admin123'
      }
    },
    {
      name: 'Invalid Password',
      data: {
        email: 'admin@systemmonitor.com',
        password: 'wrongpassword'
      }
    },
    {
      name: 'Missing Email',
      data: {
        password: 'admin123'
      }
    },
    {
      name: 'Missing Password',
      data: {
        email: 'admin@systemmonitor.com'
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Data: ${JSON.stringify(testCase.data)}`);
      
      const response = await axios.post(`${BASE_URL}/api/admin/login`, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.code}`);
      console.log(`📝 Details: ${error.response?.data?.error || error.message}`);
      
      if (error.response?.data) {
        console.log(`🔍 Full Error:`, error.response.data);
      }
    }
    console.log('---\n');
  }
};

// Test database connection via health endpoint
const testDatabaseConnection = async () => {
  console.log('🏥 Testing Database Connection...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Health Status: ${response.status}`);
    console.log(`📊 Database Status:`, response.data.database);
    console.log(`🔗 Connected: ${response.data.database.connected}`);
  } catch (error) {
    console.log(`❌ Health Check Error: ${error.response?.status || error.message}`);
  }
};

// Test if admin accounts exist
const testAdminAccounts = async () => {
  console.log('👥 Testing Admin Accounts...\n');
  
  try {
    // Try to get all admins (requires super admin token, but will show if endpoint works)
    const response = await axios.get(`${BASE_URL}/api/admin/all`);
    console.log(`✅ Get Admins Status: ${response.status}`);
    console.log(`📊 Admins Count: ${response.data.admins?.length || 0}`);
  } catch (error) {
    console.log(`❌ Get Admins Error: ${error.response?.status || error.message}`);
    console.log(`📝 Details: ${error.response?.data?.error || error.message}`);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Login Debug Tests...\n');
  
  await testDatabaseConnection();
  await testAdminAccounts();
  await testLogin();
  
  console.log('\n✅ Debug tests completed!');
};

runTests().catch(console.error); 