const axios = require('axios');

const BASE_URL = 'https://your-vercel-url.vercel.app'; // Replace with your actual Vercel URL

// Test analytics endpoints
const testAnalyticsEndpoints = async () => {
  console.log('🧪 Testing Analytics Endpoints...\n');

  const endpoints = [
    '/api/analytics/overview',
    '/api/analytics/agent-activity?period=7d&granularity=daily',
    '/api/analytics/performance?period=24h&granularity=hourly',
    '/api/analytics/geographic',
    '/api/analytics/commands?period=7d',
    '/api/analytics/top-agents?metric=uptime&limit=5',
    '/api/analytics/activation-codes?period=30d',
    '/api/analytics/alerts?severity=high&limit=10'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.message}`);
      console.log(`📝 Details: ${error.response?.data?.message || error.message}`);
    }
    console.log('---');
  }
};

// Test super admin endpoints (requires authentication)
const testSuperAdminEndpoints = async () => {
  console.log('\n👑 Testing Super Admin Analytics Endpoints...\n');

  const endpoints = [
    '/api/analytics/super/overview',
    '/api/analytics/super/agent-activity?period=7d&granularity=daily',
    '/api/analytics/super/performance?period=24h&granularity=hourly',
    '/api/analytics/super/geographic',
    '/api/analytics/super/commands?period=7d',
    '/api/analytics/super/top-agents?metric=uptime&limit=5',
    '/api/analytics/super/activation-codes?period=30d',
    '/api/analytics/super/alerts?severity=high&limit=10'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.message}`);
      console.log(`📝 Details: ${error.response?.data?.message || error.message}`);
    }
    console.log('---');
  }
};

// Test health endpoint
const testHealthEndpoint = async () => {
  console.log('\n🏥 Testing Health Endpoint...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Health Status: ${response.status}`);
    console.log(`📊 Health Data:`, response.data);
  } catch (error) {
    console.log(`❌ Health Error: ${error.response?.status || error.message}`);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Analytics Endpoint Tests...\n');
  
  await testHealthEndpoint();
  await testAnalyticsEndpoints();
  await testSuperAdminEndpoints();
  
  console.log('\n✅ Tests completed!');
};

// Check if BASE_URL is set
if (BASE_URL === 'https://your-vercel-url.vercel.app') {
  console.log('❌ Please update the BASE_URL in this file with your actual Vercel URL');
  console.log('Example: https://your-app-name.vercel.app');
} else {
  runTests().catch(console.error);
} 