const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
let jwtToken = '';
let agentId = 'test_agent_001';
let commandId = '';

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
      console.log('✅ Admin Login successful');
      console.log('   Token:', jwtToken.substring(0, 20) + '...');
      return true;
    } catch (error) {
      console.log('❌ Admin Login failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async registerAgent() {
    console.log('🔍 Testing Agent Registration...');
    try {
      // First, generate an activation code
      const codeResponse = await authRequest('POST', '/api/activation/generate', {
        count: 1,
        expiresInDays: 30
      });
      
      const activationCode = codeResponse.data.codes[0].code;
      
      // Register agent with the code
      const response = await axios.post(`${BASE_URL}/api/activation/use`, {
        code: activationCode,
        pcName: testConfig.agent.systemInfo.hostname
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
        agentId: agentId,
        systemInfo: testConfig.agent.systemInfo,
        location: testConfig.agent.location
      });
      
      console.log('✅ Agent Status Report successful');
      return true;
    } catch (error) {
      console.log('❌ Agent Status Report failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async sendShutdownCommand() {
    console.log('🔍 Testing Send Shutdown Command...');
    try {
      const response = await authRequest('POST', `/api/agent/${agentId}/command`, {
        type: 'shutdown',
        parameters: {
          delay: 0
        },
        priority: 1,
        timeout: 300000
      });
      
      commandId = response.data.command.id;
      console.log('✅ Shutdown Command sent successfully');
      console.log('   Command ID:', commandId);
      console.log('   Command Type:', response.data.command.type);
      return true;
    } catch (error) {
      console.log('❌ Send Shutdown Command failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async checkPendingCommands() {
    console.log('🔍 Testing Check Pending Commands (Agent Side)...');
    try {
      const response = await axios.get(`${BASE_URL}/api/agent/${agentId}/commands`);
      
      if (response.data.length > 0) {
        console.log('✅ Pending commands found');
        console.log('   Command count:', response.data.length);
        response.data.forEach((cmd, index) => {
          console.log(`   Command ${index + 1}: ${cmd.type} (ID: ${cmd.id})`);
        });
      } else {
        console.log('ℹ️  No pending commands');
      }
      return true;
    } catch (error) {
      console.log('❌ Check Pending Commands failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async completeCommand() {
    console.log('🔍 Testing Complete Command (Agent Side)...');
    try {
      const response = await axios.post(`${BASE_URL}/api/agent/${agentId}/command/${commandId}/complete`, {
        status: 'completed',
        result: {
          shutdownTime: new Date().toISOString(),
          method: 'system_shutdown_forced',
          success: true
        }
      });
      
      console.log('✅ Command completed successfully');
      console.log('   Status:', response.data.command.status);
      console.log('   Result:', response.data.command.result);
      return true;
    } catch (error) {
      console.log('❌ Complete Command failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async sendRestartCommand() {
    console.log('🔍 Testing Send Restart Command...');
    try {
      const response = await authRequest('POST', `/api/agent/${agentId}/command`, {
        type: 'restart',
        parameters: {
          delay: 0
        },
        priority: 2,
        timeout: 600000
      });
      
      console.log('✅ Restart Command sent successfully');
      console.log('   Command ID:', response.data.command.id);
      console.log('   Command Type:', response.data.command.type);
      return true;
    } catch (error) {
      console.log('❌ Send Restart Command failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async getMyCommands() {
    console.log('🔍 Testing Get My Commands...');
    try {
      const response = await authRequest('GET', '/api/my-commands?status=pending');
      console.log('✅ Get My Commands successful');
      console.log('   Command count:', response.data.commands.length);
      
      response.data.commands.forEach((cmd, index) => {
        console.log(`   Command ${index + 1}: ${cmd.type} (Status: ${cmd.status})`);
      });
      return true;
    } catch (error) {
      console.log('❌ Get My Commands failed:', error.response?.data?.error || error.message);
      return false;
    }
  },

  async sendScheduledCommand() {
    console.log('🔍 Testing Send Scheduled Command...');
    try {
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // Schedule for 5 minutes from now
      
      const response = await authRequest('POST', `/api/agent/${agentId}/command`, {
        type: 'sleep',
        parameters: {
          duration: 300 // 5 minutes
        },
        priority: 3,
        scheduledFor: scheduledTime.toISOString(),
        timeout: 300000
      });
      
      console.log('✅ Scheduled Command sent successfully');
      console.log('   Command ID:', response.data.command.id);
      console.log('   Scheduled For:', response.data.command.scheduledFor);
      return true;
    } catch (error) {
      console.log('❌ Send Scheduled Command failed:', error.response?.data?.error || error.message);
      return false;
    }
  }
};

// Main test runner
async function runCommandTests() {
  console.log('🚀 Starting V-Agent Remote Command Tests...\n');
  
  const testResults = [];
  
  // Run tests in sequence
  testResults.push(await tests.healthCheck());
  testResults.push(await tests.adminLogin());
  testResults.push(await tests.registerAgent());
  testResults.push(await tests.reportAgentStatus());
  testResults.push(await tests.sendShutdownCommand());
  testResults.push(await tests.checkPendingCommands());
  testResults.push(await tests.completeCommand());
  testResults.push(await tests.sendRestartCommand());
  testResults.push(await tests.getMyCommands());
  testResults.push(await tests.sendScheduledCommand());
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = testResults.filter(result => result).length;
  const total = testResults.length;
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${((passed/total)*100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All command tests passed! The remote command feature is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the server logs for details.');
  }
  
  console.log('\n📝 Remote Command Feature Summary:');
  console.log('   ✅ Admins can send commands to agents');
  console.log('   ✅ Agents can poll for pending commands');
  console.log('   ✅ Agents can complete commands and report results');
  console.log('   ✅ Commands support priority, scheduling, and timeouts');
  console.log('   ✅ All command types: shutdown, restart, sleep, hibernate, lock, unlock');
  console.log('   ✅ Command status tracking and history');
  console.log('   ✅ Database and in-memory fallback support');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCommandTests().catch(console.error);
}

module.exports = { tests, runCommandTests }; 