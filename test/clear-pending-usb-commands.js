const mongoose = require('mongoose');
const UsbControlCommand = require('./models/UsbControlCommand');

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

async function clearPendingUsbCommands() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🗑️ Clearing pending USB commands...');
    
    // List of command IDs to clear
    const commandIdsToClear = [
      'usb-Y6XWMWJE',
      'usb-E9PO31Z9', 
      'usb-CDOQIAB9'
    ];
    
    console.log('📋 Commands to clear:', commandIdsToClear);
    
    // Find and delete the specific commands
    const result = await UsbControlCommand.deleteMany({
      commandId: { $in: commandIdsToClear }
    });
    
    console.log(`✅ Successfully cleared ${result.deletedCount} pending USB commands`);
    
    // Verify they're gone
    const remainingCommands = await UsbControlCommand.find({
      commandId: { $in: commandIdsToClear }
    });
    
    if (remainingCommands.length === 0) {
      console.log('✅ All specified commands have been cleared successfully');
    } else {
      console.log('⚠️ Some commands may still exist:', remainingCommands.map(c => c.commandId));
    }
    
    // Show remaining pending commands
    const allPendingCommands = await UsbControlCommand.find({ status: 'pending' });
    console.log(`📊 Total pending USB commands remaining: ${allPendingCommands.length}`);
    
    if (allPendingCommands.length > 0) {
      console.log('📋 Remaining pending commands:');
      allPendingCommands.forEach(cmd => {
        console.log(`  - ${cmd.commandId} (${cmd.action}) - ${cmd.reason}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
clearPendingUsbCommands(); 