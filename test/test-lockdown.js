const axios = require('axios');

const BASE_URL = 'https://agentbackend-mde1.onrender.com';

// Test configuration
const testConfig = {
  admin: {
    email: 'admin@v-agent.com',
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
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'New York',
        country: 'USA',
        postalCode: '10001',
        formattedAddress: '123 Main Street, New York, New York, USA'
      },
      timezone: 'America/New_York',
      accuracy: 'high',
      source: 'ip-geolocation + reverse-geocoding',
      lastUpdated: new Date().toISOString()
    }
  }
};

let jwtToken = '';
let activationCode = '';
let agentId = '';

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

async function testLockdownSystem() {
  console.log('🔍 Testing Lockdown System...');
  
  try {
    // Step 1: Admin Login
    console.log('\n1. Testing Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
      email: testConfig.admin.email,
      password: testConfig.admin.password
    });
    
    jwtToken = loginResponse.data.token;
    console.log('✅ Admin Login successful');
    console.log('   Token:', jwtToken.substring(0, 20) + '...');
    
    // Step 2: Generate Activation Code
    console.log('\n2. Testing Activation Code Generation...');
    const codeResponse = await authRequest('POST', '/api/activation/generate', {
      count: 1,
      expiresInDays: 30
    });
    
    activationCode = codeResponse.data.codes[0].code;
    console.log('✅ Activation Code generated');
    console.log('   Code:', activationCode);
    
    // Step 3: Register Agent
    console.log('\n3. Testing Agent Registration...');
    const agentResponse = await axios.post(`${BASE_URL}/api/activation/use`, {
      code: activationCode,
      pcName: testConfig.agent.systemInfo.hostname,
      systemInfo: testConfig.agent.systemInfo,
      location: testConfig.agent.location
    });
    
    agentId = agentResponse.data.agent.agentId;
    console.log('✅ Agent Registration successful');
    console.log('   Agent ID:', agentId);
    
    // Step 4: Report Agent Status
    console.log('\n4. Testing Agent Status Report...');
    const statusResponse = await axios.post(`${BASE_URL}/api/agent/report`, {
      agentId: agentId,
      systemInfo: {
        ...testConfig.agent.systemInfo,
        uptime: 86400,
        load: 0.5
      },
      location: testConfig.agent.location
    });
    
    console.log('✅ Agent Status Report successful');
    
    // Step 5: Test Lockdown Initiation
    console.log('\n5. Testing Lockdown Initiation...');
    const lockdownResponse = await authRequest('POST', `/api/lockdown/agent/${agentId}/lockdown`, {
      adminContactInfo: {
        name: "Test Administrator",
        phone: "+1-555-0123",
        email: "admin@test.com",
        message: "Test lockdown initiated"
      },
      reason: "Test lockdown for system verification",
      priority: 10
    });
    
    console.log('✅ Lockdown Initiation successful');
    console.log('   Lockdown ID:', lockdownResponse.data.lockdown.id);
    console.log('   Command ID:', lockdownResponse.data.command.id);
    
    // Step 6: Check Lockdown Status
    console.log('\n6. Testing Lockdown Status Check...');
    const statusCheckResponse = await authRequest('GET', `/api/lockdown/agent/${agentId}/status`);
    
    console.log('✅ Lockdown Status Check successful');
    console.log('   Is Locked Down:', statusCheckResponse.data.isLockedDown);
    
    // Step 7: Test Lockdown Release
    console.log('\n7. Testing Lockdown Release...');
    const releaseResponse = await authRequest('POST', `/api/lockdown/agent/${agentId}/release`, {
      reason: "Test lockdown completed"
    });
    
    console.log('✅ Lockdown Release successful');
    
    console.log('\n🎉 All lockdown tests passed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testLockdownSystem(); 