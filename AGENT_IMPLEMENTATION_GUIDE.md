# 🖥️ V-Agent Client Implementation Guide

## 🚨 **CRITICAL FIX: Command Execution Flow**

The main issue with repeated command execution has been fixed. Here's the **correct command execution flow** that agents must follow:

## 📋 **Required Agent Implementation**

### **1. Command Polling (Every 30 seconds)**
```javascript
// Poll for pending commands
const pollCommands = async () => {
  try {
    const response = await fetch(`http://localhost:4000/api/command/agent/${agentId}/commands`);
    const commands = await response.json();
    
    if (commands.length > 0) {
      // Process the first command (highest priority)
      const command = commands[0];
      await executeCommand(command);
    }
  } catch (error) {
    console.error('Error polling commands:', error);
  }
};

// Start polling
setInterval(pollCommands, 30000); // Every 30 seconds
```

### **2. Command Execution Flow**
```javascript
const executeCommand = async (command) => {
  try {
    console.log(`Executing command: ${command.type}`);
    
    // STEP 1: Mark command as executing
    await fetch(`http://localhost:4000/api/command/agent/${agentId}/command/${command.id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // STEP 2: Execute the actual command
    let result = {};
    let success = true;
    let error = null;
    
    try {
      switch (command.type) {
        case 'shutdown':
          result = await executeShutdown(command.parameters);
          break;
        case 'restart':
          result = await executeRestart(command.parameters);
          break;
        case 'lock':
          result = await executeLock(command.parameters);
          break;
        case 'unlock':
          result = await executeUnlock(command.parameters);
          break;
        case 'sleep':
          result = await executeSleep(command.parameters);
          break;
        case 'hibernate':
          result = await executeHibernate(command.parameters);
          break;
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (execError) {
      success = false;
      error = execError.message;
    }
    
    // STEP 3: Report completion
    await fetch(`http://localhost:4000/api/command/agent/${agentId}/command/${command.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: success ? 'completed' : 'failed',
        result: result,
        error: error
      })
    });
    
    console.log(`Command ${command.type} ${success ? 'completed' : 'failed'}`);
    
  } catch (error) {
    console.error('Error executing command:', error);
  }
};
```

### **3. Command Implementation Examples**

#### **Shutdown Command**
```javascript
const executeShutdown = async (parameters) => {
  const delay = parameters.delay || 0;
  
  if (delay > 0) {
    console.log(`Shutdown scheduled in ${delay} seconds`);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }
  
  // Windows
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('shutdown /s /t 0 /f', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  // Linux/Mac
  else {
    const { exec } = require('child_process');
    exec('shutdown -h now', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  
  return {
    shutdownTime: new Date().toISOString(),
    method: 'system_shutdown_forced',
    success: true
  };
};
```

#### **Restart Command**
```javascript
const executeRestart = async (parameters) => {
  const delay = parameters.delay || 0;
  
  if (delay > 0) {
    console.log(`Restart scheduled in ${delay} seconds`);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }
  
  // Windows
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('shutdown /r /t 0 /f', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  // Linux/Mac
  else {
    const { exec } = require('child_process');
    exec('shutdown -r now', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  
  return {
    restartTime: new Date().toISOString(),
    method: 'system_restart_forced',
    success: true
  };
};
```

#### **Lock Command**
```javascript
const executeLock = async (parameters) => {
  // Windows
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('rundll32.exe user32.dll,LockWorkStation', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  // Linux
  else if (process.platform === 'linux') {
    const { exec } = require('child_process');
    exec('gnome-screensaver-command --lock', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  // Mac
  else if (process.platform === 'darwin') {
    const { exec } = require('child_process');
    exec('pmset displaysleepnow', (error, stdout, stderr) => {
      if (error) throw error;
    });
  }
  
  return {
    lockTime: new Date().toISOString(),
    method: 'system_lock',
    success: true
  };
};
```

## 🔧 **Complete Agent Example**

```javascript
const axios = require('axios');
const os = require('os');
const { exec } = require('child_process');

class VAgent {
  constructor(agentId, serverUrl = 'http://localhost:4000') {
    this.agentId = agentId;
    this.serverUrl = serverUrl;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log(`V-Agent started with ID: ${this.agentId}`);
    
    // Start polling for commands
    this.startCommandPolling();
    
    // Start status reporting
    this.startStatusReporting();
  }

  startCommandPolling() {
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const response = await axios.get(`${this.serverUrl}/api/command/agent/${this.agentId}/commands`);
        const commands = response.data;
        
        if (commands.length > 0) {
          console.log(`Found ${commands.length} pending command(s)`);
          await this.executeCommand(commands[0]);
        }
      } catch (error) {
        console.error('Error polling commands:', error.message);
      }
    }, 30000); // Every 30 seconds
  }

  async executeCommand(command) {
    try {
      console.log(`Executing command: ${command.type}`);
      
      // Mark as executing
      await axios.post(`${this.serverUrl}/api/command/agent/${this.agentId}/command/${command.id}/start`);
      
      // Execute command
      let result = {};
      let success = true;
      let error = null;
      
      try {
        switch (command.type) {
          case 'shutdown':
            result = await this.executeShutdown(command.parameters);
            break;
          case 'restart':
            result = await this.executeRestart(command.parameters);
            break;
          case 'lock':
            result = await this.executeLock(command.parameters);
            break;
          case 'unlock':
            result = await this.executeUnlock(command.parameters);
            break;
          default:
            throw new Error(`Unknown command type: ${command.type}`);
        }
      } catch (execError) {
        success = false;
        error = execError.message;
      }
      
      // Report completion
      await axios.post(`${this.serverUrl}/api/command/agent/${this.agentId}/command/${command.id}/complete`, {
        status: success ? 'completed' : 'failed',
        result: result,
        error: error
      });
      
      console.log(`Command ${command.type} ${success ? 'completed' : 'failed'}`);
      
    } catch (error) {
      console.error('Error executing command:', error.message);
    }
  }

  async executeShutdown(parameters) {
    const delay = parameters.delay || 0;
    
    if (delay > 0) {
      console.log(`Shutdown scheduled in ${delay} seconds`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
    
    const command = process.platform === 'win32' ? 'shutdown /s /t 0 /f' : 'shutdown -h now';
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            shutdownTime: new Date().toISOString(),
            method: 'system_shutdown_forced',
            success: true
          });
        }
      });
    });
  }

  async executeRestart(parameters) {
    const delay = parameters.delay || 0;
    
    if (delay > 0) {
      console.log(`Restart scheduled in ${delay} seconds`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
    
    const command = process.platform === 'win32' ? 'shutdown /r /t 0 /f' : 'shutdown -r now';
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            restartTime: new Date().toISOString(),
            method: 'system_restart_forced',
            success: true
          });
        }
      });
    });
  }

  async executeLock(parameters) {
    let command;
    
    if (process.platform === 'win32') {
      command = 'rundll32.exe user32.dll,LockWorkStation';
    } else if (process.platform === 'linux') {
      command = 'gnome-screensaver-command --lock';
    } else if (process.platform === 'darwin') {
      command = 'pmset displaysleepnow';
    } else {
      throw new Error('Unsupported platform for lock command');
    }
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            lockTime: new Date().toISOString(),
            method: 'system_lock',
            success: true
          });
        }
      });
    });
  }

  async executeUnlock(parameters) {
    // Note: Unlock typically requires user interaction
    // This is a placeholder implementation
    return {
      unlockTime: new Date().toISOString(),
      method: 'system_unlock',
      success: true,
      note: 'Unlock may require user interaction'
    };
  }

  startStatusReporting() {
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const systemInfo = {
          os: os.platform(),
          version: os.release(),
          architecture: os.arch(),
          hostname: os.hostname(),
          cpu: os.cpus()[0].model,
          memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
          uptime: os.uptime()
        };

        const location = {
          coordinates: {
            latitude: 0,
            longitude: 0
          },
          address: {
            street: 'Unknown',
            city: 'Unknown',
            state: 'Unknown',
            country: 'Unknown',
            postalCode: 'Unknown',
            formattedAddress: 'Unknown'
          },
          timezone: 'UTC',
          accuracy: 'unknown',
          source: 'ip-geolocation + reverse-geocoding',
          lastUpdated: new Date().toISOString()
        };

        await axios.post(`${this.serverUrl}/api/agent/report`, {
          agentId: this.agentId,
          systemInfo: systemInfo,
          location: location
        });
      } catch (error) {
        console.error('Error reporting status:', error.message);
      }
    }, 60000); // Every minute
  }

  stop() {
    this.isRunning = false;
    console.log('V-Agent stopped');
  }
}

// Usage
const agent = new VAgent('your-agent-id-here');
agent.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down V-Agent...');
  agent.stop();
  process.exit(0);
});
```

## 🚨 **Key Points to Remember**

1. **ALWAYS call the start endpoint** before executing a command
2. **ALWAYS call the complete endpoint** after executing a command
3. **Handle errors properly** and report them in the completion
4. **Use proper status codes** ('completed' or 'failed')
5. **Include meaningful results** in the completion response

## 🔍 **Testing the Fix**

1. **Start the server**: `npm start`
2. **Run the agent** with the code above
3. **Send a shutdown command** from the admin panel
4. **Verify the command executes only once**

The command should now execute only once and not repeat! 