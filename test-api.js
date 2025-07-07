const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
let jwtToken = '';
let adminId = '';
let activationCodeId = '';
let agentId = '';

// Test configuration
const testConfig = {
  admin: {
    email: 'admin@systemmonitor.com',
    password: 'admin123456'
  },
  agent: {
    agentId: 'test_agent_001',
    systemInfo: {
      os: 'Windows 10',
      version: '10.0.19044',
      architecture: 'x64',
      hostname: 'TEST-DESKTOP',
      cpu: 'Intel Core i7-8700K',
      memory: '16GB',
      disk: '1TB SSD'
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA',
      timezone: 'America/New_York'
    }
  }
};

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (jwtToken) {
    config.headers.Authorization = `Bearer ${jwtToken}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const tests = {
  async healthCheck() {
    console.log('🔍 Testing Health Check...');
    try {
      const response = await axios.get(`${BASE_URL}/`);
      console.log('✅ Health Check:', response.data.message);
      return true;
    } catch (error) {
      console.log('❌ Health Check failed:', error.message);
      return false;
    }
  },

  async adminLogin() {
    console.log('🔍 Testing Admin Login...');
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/login`, {
        email: testConfig.admin.email,
        password: testConfig.admin.password
      });
      
      jwtToken = response.data.token;
      adminId = response.data.admin._id;
      console.log('✅ Admin Login successful');
      console.log('   Admin ID:', adminId);
      console.log('   Token:', jwtToken.substring(0, 20) + '...');
      return true;
    } catch (error) {
      console.log('❌ Admin Login failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async generateActivationCodes() {
    console.log('🔍 Testing Activation Code Generation...');
    try {
      const response = await authRequest('POST', '/api/activation/generate', {
        count: 2,
        expiresInDays: 30
      });
      
      activationCodeId = response.data.codes[0].id;
      const code = response.data.codes[0].code;
      console.log('✅ Activation Codes generated');
      console.log('   Code ID:', activationCodeId);
      console.log('   Sample Code:', code);
      
      // Store the code for later use
      testConfig.activationCode = code;
      return true;
    } catch (error) {
      console.log('❌ Activation Code Generation failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async registerAgent() {
    console.log('🔍 Testing Agent Registration...');
    try {
      const response = await axios.post(`${BASE_URL}/api/activation/use`, {
        code: testConfig.activationCode,
        agentId: testConfig.agent.agentId,
        systemInfo: testConfig.agent.systemInfo,
        location: testConfig.agent.location
      });
      
      agentId = response.data.agent.agentId;
      console.log('✅ Agent Registration successful');
      console.log('   Agent ID:', agentId);
      return true;
    } catch (error) {
      console.log('❌ Agent Registration failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async reportAgentStatus() {
    console.log('🔍 Testing Agent Status Report...');
    try {
      const response = await axios.post(`${BASE_URL}/api/agent/report`, {
        agentId: testConfig.agent.agentId,
        systemInfo: {
          ...testConfig.agent.systemInfo,
          uptime: 86400,
          load: 0.5
        },
        location: {
          ...testConfig.agent.location,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('✅ Agent Status Report successful');
      console.log('   Source:', response.data.source);
      return true;
    } catch (error) {
      console.log('❌ Agent Status Report failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async getMyAgents() {
    console.log('🔍 Testing Get My Agents...');
    try {
      const response = await authRequest('GET', '/api/my-agents');
      console.log('✅ Get My Agents successful');
      console.log('   Agent count:', response.data.agents.length);
      return true;
    } catch (error) {
      console.log('❌ Get My Agents failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async getMyActivationCodes() {
    console.log('🔍 Testing Get My Activation Codes...');
    try {
      const response = await authRequest('GET', '/api/activation/my-codes?status=active');
      console.log('✅ Get My Activation Codes successful');
      console.log('   Active codes:', response.data.codes.length);
      return true;
    } catch (error) {
      console.log('❌ Get My Activation Codes failed:', error.response?.data?.error || error.message);
      return false;
    }
  }
};

// Main test runner
async function runTests() {
  console.log('🚀 Starting SystemMonitor API Tests...\n');
  
  const testResults = [];
  
  // Run tests in sequence
  testResults.push(await tests.healthCheck());
  testResults.push(await tests.adminLogin());
  testResults.push(await tests.generateActivationCodes());
  testResults.push(await tests.registerAgent());
  testResults.push(await tests.reportAgentStatus());
  testResults.push(await tests.getMyAgents());
  testResults.push(await tests.getMyActivationCodes());
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = testResults.filter(result => result).length;
  const total = testResults.length;
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${((passed/total)*100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the server logs for details.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Import the postman-collection.json into Postman');
  console.log('   2. Follow the POSTMAN_SETUP.md guide');
  console.log('   3. Test all endpoints manually');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { tests, runTests }; 