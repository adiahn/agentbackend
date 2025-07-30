const Agent = require('../models/Agent');
const Command = require('../models/Command');
const ActivationCode = require('../models/ActivationCode');
const LockdownState = require('../models/LockdownState');
const UsbControlCommand = require('../models/UsbControlCommand');

// In-memory cache for analytics data (5-15 minute cache)
const analyticsCache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper function to check if cache is valid
const isCacheValid = (cacheKey) => {
  const cached = analyticsCache[cacheKey];
  return cached && (Date.now() - cached.timestamp) < CACHE_DURATION;
};

// Helper function to get cached data or execute query
const getCachedData = async (cacheKey, queryFunction) => {
  if (isCacheValid(cacheKey)) {
    return analyticsCache[cacheKey].data;
  }
  
  const data = await queryFunction();
  analyticsCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Helper function to format uptime
const formatUptime = (uptimeSeconds) => {
  const days = Math.floor(uptimeSeconds / (24 * 3600));
  const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// Helper function to calculate agent status
const getAgentStatus = (agent) => {
  if (!agent.lastSeen) return 'offline';
  
  const timeSinceLastSeen = Date.now() - new Date(agent.lastSeen).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (timeSinceLastSeen <= fiveMinutes) return 'active';
  if (timeSinceLastSeen <= thirtyMinutes) return 'delayed';
  return 'offline';
};

// 1. Dashboard Overview Stats
exports.getOverview = async (req, res) => {
  try {
    const data = await getCachedData('overview', async () => {
      // Get all agents with error handling
      let agents = [];
      try {
        agents = await Agent.find({}).lean();
      } catch (dbError) {
        console.error('Database query error in getOverview:', dbError);
        return {
          totalAgents: 0,
          activeAgents: 0,
          delayedAgents: 0,
          offlineAgents: 0,
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          averageDiskUsage: 0,
          topAgent: null,
          recentActivity: [],
          systemHealth: 'unknown'
        };
      }
      
      // Calculate agent status distribution
      let activeAgents = 0;
      let delayedAgents = 0;
      let offlineAgents = 0;
      let totalCpuUsage = 0;
      let totalMemoryUsage = 0;
      let totalDiskUsage = 0;
      let agentsWithMetrics = 0;
      let topAgent = null;
      let maxUptime = 0;
      
      agents.forEach(agent => {
        const status = getAgentStatus(agent);
        switch (status) {
          case 'active': activeAgents++; break;
          case 'delayed': delayedAgents++; break;
          case 'offline': offlineAgents++; break;
        }
        
        // Calculate performance averages
        if (agent.systemInfo) {
          if (typeof agent.systemInfo.cpuUsage === 'number') {
            totalCpuUsage += agent.systemInfo.cpuUsage;
            agentsWithMetrics++;
          }
          if (typeof agent.systemInfo.memoryUsage === 'number') {
            totalMemoryUsage += agent.systemInfo.memoryUsage;
          }
          if (typeof agent.systemInfo.diskUsage === 'number') {
            totalDiskUsage += agent.systemInfo.diskUsage;
          }
          
          // Find top performing agent (by uptime)
          if (typeof agent.systemInfo.uptime === 'number' && agent.systemInfo.uptime > maxUptime) {
            maxUptime = agent.systemInfo.uptime;
            topAgent = {
              id: agent.agentId,
              name: agent.pcName || agent.systemInfo.hostname || 'Unknown',
              uptime: formatUptime(agent.systemInfo.uptime),
              location: agent.location?.address?.city && agent.location?.address?.country 
                ? `${agent.location.address.city}, ${agent.location.address.country}`
                : 'Unknown'
            };
          }
        }
      });
      
      // Get commands from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const commands24h = await Command.find({
        createdAt: { $gte: yesterday }
      }).lean();
      
      const totalCommands24h = commands24h.length;
      const successfulCommands24h = commands24h.filter(cmd => cmd.status === 'completed').length;
      
      // Get critical alerts (agents with high resource usage)
      const criticalAlerts = agents.filter(agent => {
        if (!agent.systemInfo) return false;
        return agent.systemInfo.cpuUsage > 90 || 
               agent.systemInfo.memoryUsage > 95 || 
               agent.systemInfo.diskUsage > 95;
      }).length;
      
      return {
        totalAgents: agents.length,
        activeAgents,
        delayedAgents,
        offlineAgents,
        averageCpuUsage: agentsWithMetrics > 0 ? Math.round((totalCpuUsage / agentsWithMetrics) * 10) / 10 : 0,
        averageMemoryUsage: agentsWithMetrics > 0 ? Math.round((totalMemoryUsage / agentsWithMetrics) * 10) / 10 : 0,
        averageDiskUsage: agentsWithMetrics > 0 ? Math.round((totalDiskUsage / agentsWithMetrics) * 10) / 10 : 0,
        totalCommands24h,
        successfulCommands24h,
        successRate24h: totalCommands24h > 0 ? Math.round((successfulCommands24h / totalCommands24h) * 1000) / 10 : 0,
        topPerformingAgent: topAgent,
        criticalAlerts,
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
};

// 2. Agent Activity Trends
exports.getAgentActivity = async (req, res) => {
  try {
    const { period = '7d', granularity = 'daily' } = req.query;
    
    // Validate parameters
    const validPeriods = ['24h', '7d', '30d', '90d', '1y'];
    const validGranularities = ['hourly', 'daily', 'weekly', 'monthly'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be one of: 24h, 7d, 30d, 90d, 1y' });
    }
    
    if (!validGranularities.includes(granularity)) {
      return res.status(400).json({ error: 'Invalid granularity. Must be one of: hourly, daily, weekly, monthly' });
    }
    
    const cacheKey = `agent-activity-${period}-${granularity}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      let dateFormat;
      let groupBy;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          dateFormat = granularity === 'hourly' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d';
          groupBy = granularity === 'hourly' ? { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$createdAt" } }
                                            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFormat = '%Y-%m-%d';
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFormat = granularity === 'weekly' ? '%Y-W%U' : '%Y-%m-%d';
          groupBy = granularity === 'weekly' 
            ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFormat = granularity === 'weekly' ? '%Y-W%U' : '%Y-%m-%d';
          groupBy = granularity === 'weekly' 
            ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          dateFormat = '%Y-%m';
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
      }
      
      // Get agent registration trends
      const registrationTrends = await Agent.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            newRegistrations: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Get current agent counts for each time period
      const agents = await Agent.find({}).lean();
      const totalAgents = agents.length;
      
      // Calculate active agents for each time period (simplified)
      const activeAgents = agents.filter(agent => getAgentStatus(agent) === 'active').length;
      
      // Build response data
      const responseData = [];
      const registrationMap = {};
      registrationTrends.forEach(trend => {
        registrationMap[trend._id] = trend.newRegistrations;
      });
      
      // Generate data points for the requested period
      const dataPoints = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= now) {
        let dateKey;
        switch (granularity) {
          case 'hourly':
            dateKey = currentDate.toISOString().substring(0, 13) + ':00:00';
            break;
          case 'daily':
            dateKey = currentDate.toISOString().substring(0, 10);
            break;
          case 'weekly':
            // Simplified weekly grouping
            dateKey = currentDate.toISOString().substring(0, 10);
            break;
          case 'monthly':
            dateKey = currentDate.toISOString().substring(0, 7);
            break;
        }
        
        dataPoints.push({
          date: dateKey,
          totalAgents: totalAgents, // Simplified - in real implementation, calculate historical counts
          activeAgents: activeAgents, // Simplified
          newRegistrations: registrationMap[dateKey] || 0,
          averageUptime: 94.5 // Placeholder - calculate from actual data
        });
        
        // Increment date based on granularity
        switch (granularity) {
          case 'hourly':
            currentDate.setHours(currentDate.getHours() + 1);
            break;
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
        
        if (dataPoints.length > 100) break; // Prevent too many data points
      }
      
      const totalNewAgents = registrationTrends.reduce((sum, trend) => sum + trend.newRegistrations, 0);
      
      return {
        period,
        granularity,
        data: dataPoints.slice(0, 50), // Limit data points
        summary: {
          totalNewAgents,
          averageActiveRate: totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 1000) / 10 : 0,
          peakActiveAgents: activeAgents,
          growthRate: totalNewAgents > 0 ? Math.round((totalNewAgents / Math.max(totalAgents - totalNewAgents, 1)) * 1000) / 10 : 0
        }
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Agent activity analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch agent activity analytics' });
  }
};

// 3. System Performance Metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { period = '24h', granularity = 'hourly' } = req.query;
    
    const cacheKey = `performance-${period}-${granularity}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      // Get agents with system info
      const agents = await Agent.find({
        lastSeen: { $gte: startDate },
        systemInfo: { $exists: true }
      }).lean();
      
      // Generate performance metrics (simplified - in real implementation, store historical data)
      const metrics = [];
      let currentTime = new Date(startDate);
      const interval = granularity === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      
      while (currentTime <= now && metrics.length < 50) {
        const activeAgents = agents.filter(agent => {
          const agentTime = new Date(agent.lastSeen);
          return Math.abs(agentTime.getTime() - currentTime.getTime()) < interval;
        });
        
        let totalCpu = 0, totalMemory = 0, totalDisk = 0, validAgents = 0;
        let alerts = 0;
        
        activeAgents.forEach(agent => {
          if (agent.systemInfo.cpuUsage) {
            totalCpu += agent.systemInfo.cpuUsage;
            validAgents++;
          }
          if (agent.systemInfo.memoryUsage) {
            totalMemory += agent.systemInfo.memoryUsage;
          }
          if (agent.systemInfo.diskUsage) {
            totalDisk += agent.systemInfo.diskUsage;
          }
          
          // Count alerts
          if (agent.systemInfo.cpuUsage > 90 || agent.systemInfo.memoryUsage > 95 || agent.systemInfo.diskUsage > 95) {
            alerts++;
          }
        });
        
        metrics.push({
          timestamp: currentTime.toISOString(),
          averageCpu: validAgents > 0 ? Math.round((totalCpu / validAgents) * 10) / 10 : 0,
          averageMemory: validAgents > 0 ? Math.round((totalMemory / validAgents) * 10) / 10 : 0,
          averageDisk: validAgents > 0 ? Math.round((totalDisk / validAgents) * 10) / 10 : 0,
          agentCount: activeAgents.length,
          alerts
        });
        
        currentTime = new Date(currentTime.getTime() + interval);
      }
      
      return {
        period,
        granularity,
        metrics,
        thresholds: {
          cpu: { warning: 70, critical: 90 },
          memory: { warning: 80, critical: 95 },
          disk: { warning: 85, critical: 95 }
        }
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
};

// 4. Geographic Distribution
exports.getGeographicDistribution = async (req, res) => {
  try {
    const data = await getCachedData('geographic', async () => {
      const agents = await Agent.find({
        'location.address.country': { $exists: true }
      }).lean();
      
      const countryMap = {};
      const coordinates = [];
      
      agents.forEach(agent => {
        if (!agent.location?.address?.country) return;
        
        const country = agent.location.address.country;
        const city = agent.location.address.city || 'Unknown';
        
        if (!countryMap[country]) {
          countryMap[country] = {
            country,
            agentCount: 0,
            activeCount: 0,
            totalCpu: 0,
            totalMemory: 0,
            totalDisk: 0,
            agentsWithMetrics: 0,
            cities: {}
          };
        }
        
        countryMap[country].agentCount++;
        
        if (getAgentStatus(agent) === 'active') {
          countryMap[country].activeCount++;
        }
        
        // Aggregate performance metrics
        if (agent.systemInfo) {
          if (agent.systemInfo.cpuUsage) {
            countryMap[country].totalCpu += agent.systemInfo.cpuUsage;
            countryMap[country].agentsWithMetrics++;
          }
          if (agent.systemInfo.memoryUsage) {
            countryMap[country].totalMemory += agent.systemInfo.memoryUsage;
          }
          if (agent.systemInfo.diskUsage) {
            countryMap[country].totalDisk += agent.systemInfo.diskUsage;
          }
        }
        
        // City aggregation
        if (!countryMap[country].cities[city]) {
          countryMap[country].cities[city] = {
            city,
            agentCount: 0,
            activeCount: 0
          };
        }
        countryMap[country].cities[city].agentCount++;
        if (getAgentStatus(agent) === 'active') {
          countryMap[country].cities[city].activeCount++;
        }
        
        // Coordinates for map
        if (agent.location.coordinates?.latitude && agent.location.coordinates?.longitude) {
          const existingCoord = coordinates.find(coord => 
            Math.abs(coord.latitude - agent.location.coordinates.latitude) < 0.01 &&
            Math.abs(coord.longitude - agent.location.coordinates.longitude) < 0.01
          );
          
          if (existingCoord) {
            existingCoord.agentCount++;
          } else {
            coordinates.push({
              latitude: agent.location.coordinates.latitude,
              longitude: agent.location.coordinates.longitude,
              agentCount: 1,
              city,
              country
            });
          }
        }
      });
      
      // Format countries data
      const countries = Object.values(countryMap).map(countryData => ({
        country: countryData.country,
        agentCount: countryData.agentCount,
        activeCount: countryData.activeCount,
        averagePerformance: {
          cpu: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalCpu / countryData.agentsWithMetrics) * 10) / 10 : 0,
          memory: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalMemory / countryData.agentsWithMetrics) * 10) / 10 : 0,
          disk: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalDisk / countryData.agentsWithMetrics) * 10) / 10 : 0
        },
        cities: Object.values(countryData.cities).sort((a, b) => b.agentCount - a.agentCount).slice(0, 10)
      })).sort((a, b) => b.agentCount - a.agentCount);
      
      return {
        countries,
        coordinates: coordinates.sort((a, b) => b.agentCount - a.agentCount).slice(0, 100)
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Geographic distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch geographic distribution' });
  }
};

// 5. Command Analytics
exports.getCommandAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const cacheKey = `commands-${period}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      // Get commands from the period
      const commands = await Command.find({
        createdAt: { $gte: startDate }
      }).lean();
      
      // Get USB commands
      const usbCommands = await UsbControlCommand.find({
        createdAt: { $gte: startDate }
      }).lean();
      
      // Combine all commands
      const allCommands = [
        ...commands.map(cmd => ({ ...cmd, source: 'command' })),
        ...usbCommands.map(cmd => ({ ...cmd, type: 'usb_control', source: 'usb' }))
      ];
      
      const totalCommands = allCommands.length;
      const successfulCommands = allCommands.filter(cmd => cmd.status === 'completed').length;
      const failedCommands = allCommands.filter(cmd => cmd.status === 'failed').length;
      
      // Group by command type
      const commandTypes = {};
      const failureReasons = {};
      
      allCommands.forEach(cmd => {
        const type = cmd.type;
        if (!commandTypes[type]) {
          commandTypes[type] = {
            type,
            count: 0,
            successful: 0,
            failed: 0,
            totalResponseTime: 0,
            responseTimeCount: 0
          };
        }
        
        commandTypes[type].count++;
        
        if (cmd.status === 'completed') {
          commandTypes[type].successful++;
          
          // Calculate response time if available
          if (cmd.completedAt && cmd.createdAt) {
            const responseTime = (new Date(cmd.completedAt).getTime() - new Date(cmd.createdAt).getTime()) / 1000;
            commandTypes[type].totalResponseTime += responseTime;
            commandTypes[type].responseTimeCount++;
          }
        } else if (cmd.status === 'failed') {
          commandTypes[type].failed++;
          
          // Count failure reasons
          const reason = cmd.error || 'Unknown error';
          if (!failureReasons[reason]) {
            failureReasons[reason] = 0;
          }
          failureReasons[reason]++;
        }
      });
      
      // Format command types
      const formattedCommandTypes = Object.values(commandTypes).map(cmdType => ({
        type: cmdType.type,
        count: cmdType.count,
        successRate: cmdType.count > 0 ? Math.round((cmdType.successful / cmdType.count) * 1000) / 10 : 0,
        averageResponseTime: cmdType.responseTimeCount > 0 ? Math.round((cmdType.totalResponseTime / cmdType.responseTimeCount) * 10) / 10 : 0
      })).sort((a, b) => b.count - a.count);
      
      // Format failure reasons
      const formattedFailureReasons = Object.entries(failureReasons).map(([reason, count]) => ({
        reason,
        count,
        percentage: totalCommands > 0 ? Math.round((count / totalCommands) * 1000) / 10 : 0
      })).sort((a, b) => b.count - a.count).slice(0, 10);
      
      return {
        period,
        totalCommands,
        successfulCommands,
        failedCommands,
        successRate: totalCommands > 0 ? Math.round((successfulCommands / totalCommands) * 1000) / 10 : 0,
        commandTypes: formattedCommandTypes,
        failureReasons: formattedFailureReasons
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Command analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch command analytics' });
  }
};

// 6. Top Agents Performance
exports.getTopAgents = async (req, res) => {
  try {
    const { metric = 'uptime', limit = 10 } = req.query;
    
    const validMetrics = ['uptime', 'cpu', 'memory', 'disk', 'commands'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric. Must be one of: uptime, cpu, memory, disk, commands' });
    }
    
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const cacheKey = `top-agents-${metric}-${limitNum}`;
    
    const data = await getCachedData(cacheKey, async () => {
      let agents = [];
      try {
        agents = await Agent.find({
          systemInfo: { $exists: true }
        }).lean();
      } catch (dbError) {
        console.error('Database query error in getTopAgents:', dbError);
        return {
          agents: [],
          metric: metric,
          total: 0
        };
      }
      
      // Sort agents based on metric
      switch (metric) {
        case 'uptime':
          agents = agents.filter(agent => agent.systemInfo?.uptime)
                        .sort((a, b) => (b.systemInfo.uptime || 0) - (a.systemInfo.uptime || 0));
          break;
        case 'cpu':
          agents = agents.filter(agent => agent.systemInfo?.cpuUsage)
                        .sort((a, b) => (a.systemInfo.cpuUsage || 100) - (b.systemInfo.cpuUsage || 100)); // Lower is better
          break;
        case 'memory':
          agents = agents.filter(agent => agent.systemInfo?.memoryUsage)
                        .sort((a, b) => (a.systemInfo.memoryUsage || 100) - (b.systemInfo.memoryUsage || 100)); // Lower is better
          break;
        case 'disk':
          agents = agents.filter(agent => agent.systemInfo?.diskUsage)
                        .sort((a, b) => (a.systemInfo.diskUsage || 100) - (b.systemInfo.diskUsage || 100)); // Lower is better
          break;
        case 'commands':
          // Get command counts for each agent
          let commandCounts = [];
          try {
            commandCounts = await Command.aggregate([
              {
                $group: {
                  _id: '$agentId',
                  count: { $sum: 1 }
                }
              }
            ]);
          } catch (cmdError) {
            console.error('Command aggregation error in getTopAgents:', cmdError);
            commandCounts = [];
          }
          
          const commandMap = {};
          commandCounts.forEach(cmd => {
            commandMap[cmd._id] = cmd.count;
          });
          
          agents = agents.map(agent => ({
            ...agent,
            commandCount: commandMap[agent.agentId] || 0
          })).sort((a, b) => b.commandCount - a.commandCount);
          break;
      }
      
      // Format response
      const formattedAgents = agents.slice(0, limitNum).map(agent => {
        const baseAgent = {
          agentId: agent.agentId,
          pcName: agent.pcName || agent.systemInfo?.hostname || 'Unknown',
          lastSeen: agent.lastSeen,
          location: {
            city: agent.location?.address?.city || 'Unknown',
            country: agent.location?.address?.country || 'Unknown'
          }
        };
        
        switch (metric) {
          case 'uptime':
            return {
              ...baseAgent,
              uptime: formatUptime(agent.systemInfo.uptime || 0),
              uptimeSeconds: agent.systemInfo.uptime || 0
            };
          case 'cpu':
            return {
              ...baseAgent,
              cpuUsage: agent.systemInfo.cpuUsage || 0
            };
          case 'memory':
            return {
              ...baseAgent,
              memoryUsage: agent.systemInfo.memoryUsage || 0
            };
          case 'disk':
            return {
              ...baseAgent,
              diskUsage: agent.systemInfo.diskUsage || 0
            };
          case 'commands':
            return {
              ...baseAgent,
              commandCount: agent.commandCount || 0
            };
          default:
            return baseAgent;
        }
      });
      
      return {
        metric,
        agents: formattedAgents
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Top agents error:', error);
    res.status(500).json({ error: 'Failed to fetch top agents' });
  }
};

// 7. Activation Code Analytics
exports.getActivationCodeAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const cacheKey = `activation-codes-${period}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const codes = await ActivationCode.find({
        createdAt: { $gte: startDate }
      }).populate('adminId', 'username email').lean();
      
      const totalGenerated = codes.length;
      const totalUsed = codes.filter(code => code.isUsed).length;
      const expired = codes.filter(code => !code.isUsed && new Date(code.expiresAt) < now).length;
      const pending = codes.filter(code => !code.isUsed && new Date(code.expiresAt) >= now).length;
      
      // Generate trends (daily)
      const trends = {};
      codes.forEach(code => {
        const dateKey = code.createdAt.toISOString().substring(0, 10);
        if (!trends[dateKey]) {
          trends[dateKey] = {
            date: dateKey,
            generated: 0,
            used: 0,
            expired: 0
          };
        }
        
        trends[dateKey].generated++;
        if (code.isUsed) {
          trends[dateKey].used++;
        } else if (new Date(code.expiresAt) < now) {
          trends[dateKey].expired++;
        }
      });
      
      // Admin activity
      const adminActivity = {};
      codes.forEach(code => {
        const adminId = code.adminId?._id?.toString() || 'unknown';
        const adminName = code.adminId?.username || 'Unknown';
        
        if (!adminActivity[adminId]) {
          adminActivity[adminId] = {
            adminId,
            adminName,
            codesGenerated: 0,
            codesUsed: 0
          };
        }
        
        adminActivity[adminId].codesGenerated++;
        if (code.isUsed) {
          adminActivity[adminId].codesUsed++;
        }
      });
      
      const formattedAdminActivity = Object.values(adminActivity).map(admin => ({
        adminId: admin.adminId,
        adminName: admin.adminName,
        codesGenerated: admin.codesGenerated,
        successRate: admin.codesGenerated > 0 ? Math.round((admin.codesUsed / admin.codesGenerated) * 1000) / 10 : 0
      })).sort((a, b) => b.codesGenerated - a.codesGenerated);
      
      return {
        period,
        totalGenerated,
        totalUsed,
        usageRate: totalGenerated > 0 ? Math.round((totalUsed / totalGenerated) * 1000) / 10 : 0,
        expired,
        pending,
        trends: Object.values(trends).sort((a, b) => a.date.localeCompare(b.date)),
        adminActivity: formattedAdminActivity
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Activation code analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch activation code analytics' });
  }
};

// 8. Alerts & Notifications
exports.getAlerts = async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    
    const data = await getCachedData(`alerts-${severity || 'all'}-${limitNum}`, async () => {
      // Get agents with performance issues
      let agents = [];
      try {
        agents = await Agent.find({
          systemInfo: { $exists: true }
        }).lean();
      } catch (dbError) {
        console.error('Database query error in getAlerts:', dbError);
        return {
          alerts: [],
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }
      
      const alerts = [];
      
      agents.forEach(agent => {
        if (!agent.systemInfo) return;
        
        const now = new Date();
        const timeSinceLastSeen = agent.lastSeen ? now.getTime() - new Date(agent.lastSeen).getTime() : Infinity;
        
        // CPU alerts
        if (agent.systemInfo.cpuUsage > 90) {
          alerts.push({
            id: `cpu-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: agent.systemInfo.cpuUsage > 95 ? 'critical' : 'high',
            message: `Agent CPU usage above ${agent.systemInfo.cpuUsage > 95 ? '95%' : '90%'} (${agent.systemInfo.cpuUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
        
        // Memory alerts
        if (agent.systemInfo.memoryUsage > 95) {
          alerts.push({
            id: `memory-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: 'high',
            message: `Agent memory usage above 95% (${agent.systemInfo.memoryUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
        
        // Disk alerts
        if (agent.systemInfo.diskUsage > 95) {
          alerts.push({
            id: `disk-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: 'high',
            message: `Agent disk usage above 95% (${agent.systemInfo.diskUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage
            }
          });
        }
        
        // Offline alerts
        if (timeSinceLastSeen > 60 * 60 * 1000) { // 1 hour
          alerts.push({
            id: `offline-${agent.agentId}-${Date.now()}`,
            type: 'connectivity',
            severity: timeSinceLastSeen > 24 * 60 * 60 * 1000 ? 'critical' : 'medium',
            message: `Agent has been offline for ${Math.round(timeSinceLastSeen / (60 * 60 * 1000))} hours`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
      });
      
      // Filter by severity if specified
      let filteredAlerts = alerts;
      if (severity) {
        filteredAlerts = alerts.filter(alert => alert.severity === severity);
      }
      
      // Sort by timestamp (newest first) and limit
      filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        alerts: filteredAlerts.slice(0, limitNum)
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Admin-specific analytics (filtered by adminId)
// 1. Admin Dashboard Overview Stats
exports.getAdminOverview = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const cacheKey = `admin-overview-${adminId}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Get agents for this admin only
      const agents = await Agent.find({ adminId }).lean();
      
      // Calculate agent status distribution
      let activeAgents = 0;
      let delayedAgents = 0;
      let offlineAgents = 0;
      let totalCpuUsage = 0;
      let totalMemoryUsage = 0;
      let totalDiskUsage = 0;
      let agentsWithMetrics = 0;
      let topAgent = null;
      let maxUptime = 0;
      
      agents.forEach(agent => {
        const status = getAgentStatus(agent);
        switch (status) {
          case 'active': activeAgents++; break;
          case 'delayed': delayedAgents++; break;
          case 'offline': offlineAgents++; break;
        }
        
        // Calculate performance averages
        if (agent.systemInfo) {
          if (typeof agent.systemInfo.cpuUsage === 'number') {
            totalCpuUsage += agent.systemInfo.cpuUsage;
            agentsWithMetrics++;
          }
          if (typeof agent.systemInfo.memoryUsage === 'number') {
            totalMemoryUsage += agent.systemInfo.memoryUsage;
          }
          if (typeof agent.systemInfo.diskUsage === 'number') {
            totalDiskUsage += agent.systemInfo.diskUsage;
          }
          
          // Find top performing agent (by uptime)
          if (typeof agent.systemInfo.uptime === 'number' && agent.systemInfo.uptime > maxUptime) {
            maxUptime = agent.systemInfo.uptime;
            topAgent = {
              id: agent.agentId,
              name: agent.pcName || agent.systemInfo.hostname || 'Unknown',
              uptime: formatUptime(agent.systemInfo.uptime),
              location: agent.location?.address?.city && agent.location?.address?.country 
                ? `${agent.location.address.city}, ${agent.location.address.country}`
                : 'Unknown'
            };
          }
        }
      });
      
      // Get commands from last 24 hours for this admin's agents
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const commands24h = await Command.find({
        adminId,
        createdAt: { $gte: yesterday }
      }).lean();
      
      const totalCommands24h = commands24h.length;
      const successfulCommands24h = commands24h.filter(cmd => cmd.status === 'completed').length;
      
      // Get critical alerts (agents with high resource usage)
      const criticalAlerts = agents.filter(agent => {
        if (!agent.systemInfo) return false;
        return agent.systemInfo.cpuUsage > 90 || 
               agent.systemInfo.memoryUsage > 95 || 
               agent.systemInfo.diskUsage > 95;
      }).length;
      
      return {
        totalAgents: agents.length,
        activeAgents,
        delayedAgents,
        offlineAgents,
        averageCpuUsage: agentsWithMetrics > 0 ? Math.round((totalCpuUsage / agentsWithMetrics) * 10) / 10 : 0,
        averageMemoryUsage: agentsWithMetrics > 0 ? Math.round((totalMemoryUsage / agentsWithMetrics) * 10) / 10 : 0,
        averageDiskUsage: agentsWithMetrics > 0 ? Math.round((totalDiskUsage / agentsWithMetrics) * 10) / 10 : 0,
        totalCommands24h,
        successfulCommands24h,
        successRate24h: totalCommands24h > 0 ? Math.round((successfulCommands24h / totalCommands24h) * 1000) / 10 : 0,
        topPerformingAgent: topAgent,
        criticalAlerts,
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics overview' });
  }
};

// 2. Admin Agent Activity Trends
exports.getAdminAgentActivity = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { period = '7d', granularity = 'daily' } = req.query;
    
    // Validate parameters
    const validPeriods = ['24h', '7d', '30d', '90d', '1y'];
    const validGranularities = ['hourly', 'daily', 'weekly', 'monthly'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be one of: 24h, 7d, 30d, 90d, 1y' });
    }
    
    if (!validGranularities.includes(granularity)) {
      return res.status(400).json({ error: 'Invalid granularity. Must be one of: hourly, daily, weekly, monthly' });
    }
    
    const cacheKey = `admin-agent-activity-${adminId}-${period}-${granularity}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      let groupBy;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          groupBy = granularity === 'hourly' ? { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$createdAt" } }
                                            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = granularity === 'weekly' 
            ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          groupBy = granularity === 'weekly' 
            ? { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
            : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
      }
      
      // Get agent registration trends for this admin
      const registrationTrends = await Agent.aggregate([
        {
          $match: {
            adminId: adminId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            newRegistrations: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Get current agent counts for this admin
      const agents = await Agent.find({ adminId }).lean();
      const totalAgents = agents.length;
      const activeAgents = agents.filter(agent => getAgentStatus(agent) === 'active').length;
      
      // Build response data
      const registrationMap = {};
      registrationTrends.forEach(trend => {
        registrationMap[trend._id] = trend.newRegistrations;
      });
      
      // Generate data points for the requested period
      const dataPoints = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= now && dataPoints.length < 50) {
        let dateKey;
        switch (granularity) {
          case 'hourly':
            dateKey = currentDate.toISOString().substring(0, 13) + ':00:00';
            break;
          case 'daily':
            dateKey = currentDate.toISOString().substring(0, 10);
            break;
          case 'weekly':
            dateKey = currentDate.toISOString().substring(0, 10);
            break;
          case 'monthly':
            dateKey = currentDate.toISOString().substring(0, 7);
            break;
        }
        
        dataPoints.push({
          date: dateKey,
          totalAgents: totalAgents, // Simplified - in real implementation, calculate historical counts
          activeAgents: activeAgents, // Simplified
          newRegistrations: registrationMap[dateKey] || 0,
          averageUptime: 94.5 // Placeholder - calculate from actual data
        });
        
        // Increment date based on granularity
        switch (granularity) {
          case 'hourly':
            currentDate.setHours(currentDate.getHours() + 1);
            break;
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
      
      const totalNewAgents = registrationTrends.reduce((sum, trend) => sum + trend.newRegistrations, 0);
      
      return {
        period,
        granularity,
        data: dataPoints.slice(0, 50), // Limit data points
        summary: {
          totalNewAgents,
          averageActiveRate: totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 1000) / 10 : 0,
          peakActiveAgents: activeAgents,
          growthRate: totalNewAgents > 0 ? Math.round((totalNewAgents / Math.max(totalAgents - totalNewAgents, 1)) * 1000) / 10 : 0
        }
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin agent activity analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin agent activity analytics' });
  }
};

// 3. Admin Performance Metrics
exports.getAdminPerformanceMetrics = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { period = '24h', granularity = 'hourly' } = req.query;
    
    const cacheKey = `admin-performance-${adminId}-${period}-${granularity}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      // Get agents with system info for this admin only
      const agents = await Agent.find({
        adminId,
        lastSeen: { $gte: startDate },
        systemInfo: { $exists: true }
      }).lean();
      
      // Generate performance metrics (simplified - in real implementation, store historical data)
      const metrics = [];
      let currentTime = new Date(startDate);
      const interval = granularity === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      
      while (currentTime <= now && metrics.length < 50) {
        const activeAgents = agents.filter(agent => {
          const agentTime = new Date(agent.lastSeen);
          return Math.abs(agentTime.getTime() - currentTime.getTime()) < interval;
        });
        
        let totalCpu = 0, totalMemory = 0, totalDisk = 0, validAgents = 0;
        let alerts = 0;
        
        activeAgents.forEach(agent => {
          if (agent.systemInfo.cpuUsage) {
            totalCpu += agent.systemInfo.cpuUsage;
            validAgents++;
          }
          if (agent.systemInfo.memoryUsage) {
            totalMemory += agent.systemInfo.memoryUsage;
          }
          if (agent.systemInfo.diskUsage) {
            totalDisk += agent.systemInfo.diskUsage;
          }
          
          // Count alerts
          if (agent.systemInfo.cpuUsage > 90 || agent.systemInfo.memoryUsage > 95 || agent.systemInfo.diskUsage > 95) {
            alerts++;
          }
        });
        
        metrics.push({
          timestamp: currentTime.toISOString(),
          averageCpu: validAgents > 0 ? Math.round((totalCpu / validAgents) * 10) / 10 : 0,
          averageMemory: validAgents > 0 ? Math.round((totalMemory / validAgents) * 10) / 10 : 0,
          averageDisk: validAgents > 0 ? Math.round((totalDisk / validAgents) * 10) / 10 : 0,
          agentCount: activeAgents.length,
          alerts
        });
        
        currentTime = new Date(currentTime.getTime() + interval);
      }
      
      return {
        period,
        granularity,
        metrics,
        thresholds: {
          cpu: { warning: 70, critical: 90 },
          memory: { warning: 80, critical: 95 },
          disk: { warning: 85, critical: 95 }
        }
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin performance metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin performance metrics' });
  }
};

// 4. Admin Geographic Distribution
exports.getAdminGeographicDistribution = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const cacheKey = `admin-geographic-${adminId}`;
    
    const data = await getCachedData(cacheKey, async () => {
      const agents = await Agent.find({
        adminId,
        'location.address.country': { $exists: true }
      }).lean();
      
      const countryMap = {};
      const coordinates = [];
      
      agents.forEach(agent => {
        if (!agent.location?.address?.country) return;
        
        const country = agent.location.address.country;
        const city = agent.location.address.city || 'Unknown';
        
        if (!countryMap[country]) {
          countryMap[country] = {
            country,
            agentCount: 0,
            activeCount: 0,
            totalCpu: 0,
            totalMemory: 0,
            totalDisk: 0,
            agentsWithMetrics: 0,
            cities: {}
          };
        }
        
        countryMap[country].agentCount++;
        
        if (getAgentStatus(agent) === 'active') {
          countryMap[country].activeCount++;
        }
        
        // Aggregate performance metrics
        if (agent.systemInfo) {
          if (agent.systemInfo.cpuUsage) {
            countryMap[country].totalCpu += agent.systemInfo.cpuUsage;
            countryMap[country].agentsWithMetrics++;
          }
          if (agent.systemInfo.memoryUsage) {
            countryMap[country].totalMemory += agent.systemInfo.memoryUsage;
          }
          if (agent.systemInfo.diskUsage) {
            countryMap[country].totalDisk += agent.systemInfo.diskUsage;
          }
        }
        
        // City aggregation
        if (!countryMap[country].cities[city]) {
          countryMap[country].cities[city] = {
            city,
            agentCount: 0,
            activeCount: 0
          };
        }
        countryMap[country].cities[city].agentCount++;
        if (getAgentStatus(agent) === 'active') {
          countryMap[country].cities[city].activeCount++;
        }
        
        // Coordinates for map
        if (agent.location.coordinates?.latitude && agent.location.coordinates?.longitude) {
          const existingCoord = coordinates.find(coord => 
            Math.abs(coord.latitude - agent.location.coordinates.latitude) < 0.01 &&
            Math.abs(coord.longitude - agent.location.coordinates.longitude) < 0.01
          );
          
          if (existingCoord) {
            existingCoord.agentCount++;
          } else {
            coordinates.push({
              latitude: agent.location.coordinates.latitude,
              longitude: agent.location.coordinates.longitude,
              agentCount: 1,
              city,
              country
            });
          }
        }
      });
      
      // Format countries data
      const countries = Object.values(countryMap).map(countryData => ({
        country: countryData.country,
        agentCount: countryData.agentCount,
        activeCount: countryData.activeCount,
        averagePerformance: {
          cpu: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalCpu / countryData.agentsWithMetrics) * 10) / 10 : 0,
          memory: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalMemory / countryData.agentsWithMetrics) * 10) / 10 : 0,
          disk: countryData.agentsWithMetrics > 0 ? Math.round((countryData.totalDisk / countryData.agentsWithMetrics) * 10) / 10 : 0
        },
        cities: Object.values(countryData.cities).sort((a, b) => b.agentCount - a.agentCount).slice(0, 10)
      })).sort((a, b) => b.agentCount - a.agentCount);
      
      return {
        countries,
        coordinates: coordinates.sort((a, b) => b.agentCount - a.agentCount).slice(0, 100)
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin geographic distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch admin geographic distribution' });
  }
};

// 5. Admin Command Analytics
exports.getAdminCommandAnalytics = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { period = '7d' } = req.query;
    
    const cacheKey = `admin-commands-${adminId}-${period}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      // Get commands from the period for this admin only
      const commands = await Command.find({
        adminId,
        createdAt: { $gte: startDate }
      }).lean();
      
      // Get USB commands for this admin
      const usbCommands = await UsbControlCommand.find({
        adminId,
        createdAt: { $gte: startDate }
      }).lean();
      
      // Combine all commands
      const allCommands = [
        ...commands.map(cmd => ({ ...cmd, source: 'command' })),
        ...usbCommands.map(cmd => ({ ...cmd, type: 'usb_control', source: 'usb' }))
      ];
      
      const totalCommands = allCommands.length;
      const successfulCommands = allCommands.filter(cmd => cmd.status === 'completed').length;
      const failedCommands = allCommands.filter(cmd => cmd.status === 'failed').length;
      
      // Group by command type
      const commandTypes = {};
      const failureReasons = {};
      
      allCommands.forEach(cmd => {
        const type = cmd.type;
        if (!commandTypes[type]) {
          commandTypes[type] = {
            type,
            count: 0,
            successful: 0,
            failed: 0,
            totalResponseTime: 0,
            responseTimeCount: 0
          };
        }
        
        commandTypes[type].count++;
        
        if (cmd.status === 'completed') {
          commandTypes[type].successful++;
          
          // Calculate response time if available
          if (cmd.completedAt && cmd.createdAt) {
            const responseTime = (new Date(cmd.completedAt).getTime() - new Date(cmd.createdAt).getTime()) / 1000;
            commandTypes[type].totalResponseTime += responseTime;
            commandTypes[type].responseTimeCount++;
          }
        } else if (cmd.status === 'failed') {
          commandTypes[type].failed++;
          
          // Count failure reasons
          const reason = cmd.error || 'Unknown error';
          if (!failureReasons[reason]) {
            failureReasons[reason] = 0;
          }
          failureReasons[reason]++;
        }
      });
      
      // Format command types
      const formattedCommandTypes = Object.values(commandTypes).map(cmdType => ({
        type: cmdType.type,
        count: cmdType.count,
        successRate: cmdType.count > 0 ? Math.round((cmdType.successful / cmdType.count) * 1000) / 10 : 0,
        averageResponseTime: cmdType.responseTimeCount > 0 ? Math.round((cmdType.totalResponseTime / cmdType.responseTimeCount) * 10) / 10 : 0
      })).sort((a, b) => b.count - a.count);
      
      // Format failure reasons
      const formattedFailureReasons = Object.entries(failureReasons).map(([reason, count]) => ({
        reason,
        count,
        percentage: totalCommands > 0 ? Math.round((count / totalCommands) * 1000) / 10 : 0
      })).sort((a, b) => b.count - a.count).slice(0, 10);
      
      return {
        period,
        totalCommands,
        successfulCommands,
        failedCommands,
        successRate: totalCommands > 0 ? Math.round((successfulCommands / totalCommands) * 1000) / 10 : 0,
        commandTypes: formattedCommandTypes,
        failureReasons: formattedFailureReasons
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin command analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin command analytics' });
  }
};

// 6. Admin Top Agents Performance
exports.getAdminTopAgents = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { metric = 'uptime', limit = 10 } = req.query;
    
    const validMetrics = ['uptime', 'cpu', 'memory', 'disk', 'commands'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric. Must be one of: uptime, cpu, memory, disk, commands' });
    }
    
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const cacheKey = `admin-top-agents-${adminId}-${metric}-${limitNum}`;
    
    const data = await getCachedData(cacheKey, async () => {
      let agents = await Agent.find({
        adminId,
        systemInfo: { $exists: true }
      }).lean();
      
      // Sort agents based on metric
      switch (metric) {
        case 'uptime':
          agents = agents.filter(agent => agent.systemInfo?.uptime)
                        .sort((a, b) => (b.systemInfo.uptime || 0) - (a.systemInfo.uptime || 0));
          break;
        case 'cpu':
          agents = agents.filter(agent => agent.systemInfo?.cpuUsage)
                        .sort((a, b) => (a.systemInfo.cpuUsage || 100) - (b.systemInfo.cpuUsage || 100)); // Lower is better
          break;
        case 'memory':
          agents = agents.filter(agent => agent.systemInfo?.memoryUsage)
                        .sort((a, b) => (a.systemInfo.memoryUsage || 100) - (b.systemInfo.memoryUsage || 100)); // Lower is better
          break;
        case 'disk':
          agents = agents.filter(agent => agent.systemInfo?.diskUsage)
                        .sort((a, b) => (a.systemInfo.diskUsage || 100) - (b.systemInfo.diskUsage || 100)); // Lower is better
          break;
        case 'commands':
          // Get command counts for each agent
          const commandCounts = await Command.aggregate([
            {
              $match: { adminId: adminId }
            },
            {
              $group: {
                _id: '$agentId',
                count: { $sum: 1 }
              }
            }
          ]);
          
          const commandMap = {};
          commandCounts.forEach(cmd => {
            commandMap[cmd._id] = cmd.count;
          });
          
          agents = agents.map(agent => ({
            ...agent,
            commandCount: commandMap[agent.agentId] || 0
          })).sort((a, b) => b.commandCount - a.commandCount);
          break;
      }
      
      // Format response
      const formattedAgents = agents.slice(0, limitNum).map(agent => {
        const baseAgent = {
          agentId: agent.agentId,
          pcName: agent.pcName || agent.systemInfo?.hostname || 'Unknown',
          lastSeen: agent.lastSeen,
          location: {
            city: agent.location?.address?.city || 'Unknown',
            country: agent.location?.address?.country || 'Unknown'
          }
        };
        
        switch (metric) {
          case 'uptime':
            return {
              ...baseAgent,
              uptime: formatUptime(agent.systemInfo.uptime || 0),
              uptimeSeconds: agent.systemInfo.uptime || 0
            };
          case 'cpu':
            return {
              ...baseAgent,
              cpuUsage: agent.systemInfo.cpuUsage || 0
            };
          case 'memory':
            return {
              ...baseAgent,
              memoryUsage: agent.systemInfo.memoryUsage || 0
            };
          case 'disk':
            return {
              ...baseAgent,
              diskUsage: agent.systemInfo.diskUsage || 0
            };
          case 'commands':
            return {
              ...baseAgent,
              commandCount: agent.commandCount || 0
            };
          default:
            return baseAgent;
        }
      });
      
      return {
        metric,
        agents: formattedAgents
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin top agents error:', error);
    res.status(500).json({ error: 'Failed to fetch admin top agents' });
  }
};

// 7. Admin Activation Code Analytics
exports.getAdminActivationCodeAnalytics = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { period = '30d' } = req.query;
    
    const cacheKey = `admin-activation-codes-${adminId}-${period}`;
    
    const data = await getCachedData(cacheKey, async () => {
      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const codes = await ActivationCode.find({
        adminId,
        createdAt: { $gte: startDate }
      }).lean();
      
      const totalGenerated = codes.length;
      const totalUsed = codes.filter(code => code.isUsed).length;
      const expired = codes.filter(code => !code.isUsed && new Date(code.expiresAt) < now).length;
      const pending = codes.filter(code => !code.isUsed && new Date(code.expiresAt) >= now).length;
      
      // Generate trends (daily)
      const trends = {};
      codes.forEach(code => {
        const dateKey = code.createdAt.toISOString().substring(0, 10);
        if (!trends[dateKey]) {
          trends[dateKey] = {
            date: dateKey,
            generated: 0,
            used: 0,
            expired: 0
          };
        }
        
        trends[dateKey].generated++;
        if (code.isUsed) {
          trends[dateKey].used++;
        } else if (new Date(code.expiresAt) < now) {
          trends[dateKey].expired++;
        }
      });
      
      return {
        period,
        totalGenerated,
        totalUsed,
        usageRate: totalGenerated > 0 ? Math.round((totalUsed / totalGenerated) * 1000) / 10 : 0,
        expired,
        pending,
        trends: Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin activation code analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin activation code analytics' });
  }
};

// 8. Admin Alerts & Notifications
exports.getAdminAlerts = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { severity, limit = 50 } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    
    const data = await getCachedData(`admin-alerts-${adminId}-${severity || 'all'}-${limitNum}`, async () => {
      // Get agents with performance issues for this admin only
      const agents = await Agent.find({
        adminId,
        systemInfo: { $exists: true }
      }).lean();
      
      const alerts = [];
      
      agents.forEach(agent => {
        if (!agent.systemInfo) return;
        
        const now = new Date();
        const timeSinceLastSeen = agent.lastSeen ? now.getTime() - new Date(agent.lastSeen).getTime() : Infinity;
        
        // CPU alerts
        if (agent.systemInfo.cpuUsage > 90) {
          alerts.push({
            id: `cpu-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: agent.systemInfo.cpuUsage > 95 ? 'critical' : 'high',
            message: `Agent CPU usage above ${agent.systemInfo.cpuUsage > 95 ? '95%' : '90%'} (${agent.systemInfo.cpuUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
        
        // Memory alerts
        if (agent.systemInfo.memoryUsage > 95) {
          alerts.push({
            id: `memory-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: 'high',
            message: `Agent memory usage above 95% (${agent.systemInfo.memoryUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
        
        // Disk alerts
        if (agent.systemInfo.diskUsage > 95) {
          alerts.push({
            id: `disk-${agent.agentId}-${Date.now()}`,
            type: 'performance',
            severity: 'high',
            message: `Agent disk usage above 95% (${agent.systemInfo.diskUsage}%)`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage
            }
          });
        }
        
        // Offline alerts
        if (timeSinceLastSeen > 60 * 60 * 1000) { // 1 hour
          alerts.push({
            id: `offline-${agent.agentId}-${Date.now()}`,
            type: 'connectivity',
            severity: timeSinceLastSeen > 24 * 60 * 60 * 1000 ? 'critical' : 'medium',
            message: `Agent has been offline for ${Math.round(timeSinceLastSeen / (60 * 60 * 1000))} hours`,
            agentId: agent.agentId,
            agentName: agent.pcName || agent.systemInfo.hostname || 'Unknown',
            timestamp: agent.lastSeen || agent.createdAt,
            resolved: false,
            metrics: {
              cpu: agent.systemInfo.cpuUsage || 0,
              memory: agent.systemInfo.memoryUsage || 0,
              disk: agent.systemInfo.diskUsage || 0
            }
          });
        }
      });
      
      // Filter by severity if specified
      let filteredAlerts = alerts;
      if (severity) {
        filteredAlerts = alerts.filter(alert => alert.severity === severity);
      }
      
      // Sort by timestamp (newest first) and limit
      filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        alerts: filteredAlerts.slice(0, limitNum)
      };
    });
    
    res.json(data);
  } catch (error) {
    console.error('Admin alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch admin alerts' });
  }
};

module.exports = {
  // Super admin endpoints (existing)
  getOverview: exports.getOverview,
  getAgentActivity: exports.getAgentActivity,
  getPerformanceMetrics: exports.getPerformanceMetrics,
  getGeographicDistribution: exports.getGeographicDistribution,
  getCommandAnalytics: exports.getCommandAnalytics,
  getTopAgents: exports.getTopAgents,
  getActivationCodeAnalytics: exports.getActivationCodeAnalytics,
  getAlerts: exports.getAlerts,
  
  // Admin-specific endpoints (new)
  getAdminOverview: exports.getAdminOverview,
  getAdminAgentActivity: exports.getAdminAgentActivity,
  getAdminPerformanceMetrics: exports.getAdminPerformanceMetrics,
  getAdminGeographicDistribution: exports.getAdminGeographicDistribution,
  getAdminCommandAnalytics: exports.getAdminCommandAnalytics,
  getAdminTopAgents: exports.getAdminTopAgents,
  getAdminActivationCodeAnalytics: exports.getAdminActivationCodeAnalytics,
  getAdminAlerts: exports.getAdminAlerts
}; 