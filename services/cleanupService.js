const LockdownState = require('../models/LockdownState');
const LockdownEvent = require('../models/LockdownEvent');

class CleanupService {
  // Clean up expired lockdowns
  static async cleanupExpiredLockdowns() {
    try {
      console.log('Starting expired lockdown cleanup...');
      
      const result = await LockdownState.cleanupExpired();
      
      if (result.modifiedCount > 0) {
        console.log(`Cleaned up ${result.modifiedCount} expired lockdowns`);
        
        // Log the cleanup event
        await LockdownEvent.logEvent({
          agentId: 'system',
          eventType: 'expired',
          reason: `System cleanup: ${result.modifiedCount} expired lockdowns cleared`,
          metadata: {
            cleanupCount: result.modifiedCount,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error during lockdown cleanup:', error);
      throw error;
    }
  }

  // Clean up old events (keep last 30 days)
  static async cleanupOldEvents() {
    try {
      console.log('Starting old events cleanup...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await LockdownEvent.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} old events`);
      }
      
      return result;
    } catch (error) {
      console.error('Error during events cleanup:', error);
      throw error;
    }
  }

  // Run all cleanup tasks
  static async runCleanup() {
    try {
      console.log('Starting system cleanup...');
      
      const [lockdownResult, eventsResult] = await Promise.all([
        this.cleanupExpiredLockdowns(),
        this.cleanupOldEvents()
      ]);
      
      console.log('System cleanup completed successfully');
      
      return {
        lockdownsCleaned: lockdownResult.modifiedCount || 0,
        eventsCleaned: eventsResult.deletedCount || 0
      };
    } catch (error) {
      console.error('Error during system cleanup:', error);
      throw error;
    }
  }
}

module.exports = CleanupService; 