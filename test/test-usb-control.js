const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
let adminToken = '';
let agentId = 'test-agent-123';

// Test data
const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123'
};

const testUsbCommand = {
  action: 'disable',
  reason: 'Security lockdown - testing USB control',
  priority: 1
};

async function testUsbControl() {
  console.log('🧪 Testing USB Control System...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/login`, testAdmin);
    adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Send USB control command
    console.log('2. Sending USB control command...');
    const usbCommandResponse = await axios.post(
      `${BASE_URL}/usb/agent/${agentId}/usb-command`,
      testUsbCommand,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ USB command sent successfully');
    console.log('Response:', JSON.stringify(usbCommandResponse.data, null, 2), '\n');

    // Step 3: Get USB status
    console.log('3. Getting USB status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/usb/agent/${agentId}/usb-status`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ USB status retrieved');
    console.log('Status:', JSON.stringify(statusResponse.data, null, 2), '\n');

    // Step 4: Get USB history
    console.log('4. Getting USB history...');
    const historyResponse = await axios.get(
      `${BASE_URL}/usb/agent/${agentId}/usb-history`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ USB history retrieved');
    console.log('History:', JSON.stringify(historyResponse.data, null, 2), '\n');

    // Step 5: Test agent polling for USB commands
    console.log('5. Testing agent polling for USB commands...');
    const pollingResponse = await axios.get(`${BASE_URL}/usb/agent/${agentId}/usb-commands`);
    console.log('✅ Agent polling successful');
    console.log('Pending commands:', JSON.stringify(pollingResponse.data, null, 2), '\n');

    // Step 6: Test sending enable command
    console.log('6. Sending USB enable command...');
    const enableCommand = {
      action: 'enable',
      reason: 'Testing USB enable functionality',
      priority: 1
    };
    const enableResponse = await axios.post(
      `${BASE_URL}/usb/agent/${agentId}/usb-command`,
      enableCommand,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ USB enable command sent successfully');
    console.log('Response:', JSON.stringify(enableResponse.data, null, 2), '\n');

    // Step 7: Test command completion (simulating agent response)
    if (pollingResponse.data.length > 0) {
      const commandId = pollingResponse.data[0].id;
      console.log(`7. Simulating command completion for command: ${commandId}...`);
      const completeResponse = await axios.post(
        `${BASE_URL}/usb/agent/${agentId}/usb-command/${commandId}/complete`,
        {
          status: 'completed',
          result: { success: true, message: 'USB control executed successfully' }
        }
      );
      console.log('✅ Command completion simulated successfully');
      console.log('Response:', JSON.stringify(completeResponse.data, null, 2), '\n');
    }

    // Step 8: Test using the general command endpoint with usb_control type
    console.log('8. Testing general command endpoint with usb_control type...');
    const generalCommand = {
      type: 'usb_control',
      parameters: {
        action: 'disable',
        reason: 'Testing via general command endpoint',
        adminId: 'admin123'
      },
      priority: 1
    };
    const generalResponse = await axios.post(
      `${BASE_URL}/command/agent/${agentId}/command`,
      generalCommand,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ General command endpoint test successful');
    console.log('Response:', JSON.stringify(generalResponse.data, null, 2), '\n');

    console.log('🎉 All USB control tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('- USB command sending: ✅');
    console.log('- USB status retrieval: ✅');
    console.log('- USB history retrieval: ✅');
    console.log('- Agent polling: ✅');
    console.log('- Command completion: ✅');
    console.log('- General command endpoint: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
testUsbControl(); 