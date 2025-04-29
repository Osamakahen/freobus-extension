import { EventEmitter } from 'events';
import { 
  SessionMetrics, 
  ConnectionStats, 
  NetworkSwitchEvent, 
  PermissionUsageStats,
  SessionHealthDashboard
} from '../types';

export class SessionAnalyticsManager extends EventEmitter {
  private metrics: Map<string, SessionMetrics> = new Map();
  private connectionStats: ConnectionStats[] = [];
  private networkSwitches: NetworkSwitchEvent[] = [];
  private permissionUsage: PermissionUsageStats = {
    totalRequests: 0,
    byMethod: {},
    byOrigin: {},
    errorCount: 0
  };

  constructor() {
    super();
    this.initializeDailyStats();
  }

  private initializeDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    this.connectionStats.push({
      date: today,
      totalConnections: 0,
      successfulConnections: 0,
      averageLatency: 0,
      errorCount: 0
    });
  }

  public trackRequest(origin: string, method: string, success: boolean, latency: number) {
    // Update session metrics
    const sessionMetrics = this.metrics.get(origin) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };

    sessionMetrics.totalRequests++;
    if (success) {
      sessionMetrics.successfulRequests++;
    } else {
      sessionMetrics.failedRequests++;
    }

    // Update average latency
    sessionMetrics.averageLatency = 
      (sessionMetrics.averageLatency * (sessionMetrics.totalRequests - 1) + latency) / 
      sessionMetrics.totalRequests;

    sessionMetrics.errorRate = sessionMetrics.failedRequests / sessionMetrics.totalRequests;
    sessionMetrics.lastUpdated = Date.now();

    this.metrics.set(origin, sessionMetrics);

    // Update permission usage
    this.permissionUsage.totalRequests++;
    this.permissionUsage.byMethod[method] = (this.permissionUsage.byMethod[method] || 0) + 1;
    this.permissionUsage.byOrigin[origin] = (this.permissionUsage.byOrigin[origin] || 0) + 1;
    if (!success) {
      this.permissionUsage.errorCount++;
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.connectionStats[this.connectionStats.length - 1];
    if (todayStats.date !== today) {
      this.initializeDailyStats();
    } else {
      todayStats.totalConnections++;
      if (success) {
        todayStats.successfulConnections++;
      } else {
        todayStats.errorCount++;
      }
      todayStats.averageLatency = 
        (todayStats.averageLatency * (todayStats.totalConnections - 1) + latency) / 
        todayStats.totalConnections;
    }

    this.emit('metricsUpdated', this.getDashboard());
  }

  public trackNetworkSwitch(fromChainId: string, toChainId: string, success: boolean, latency: number) {
    this.networkSwitches.push({
      timestamp: Date.now(),
      fromChainId,
      toChainId,
      success,
      latency
    });

    this.emit('metricsUpdated', this.getDashboard());
  }

  public getDashboard(): SessionHealthDashboard {
    const realTimeMetrics = {
      connectionSuccess: this.calculateConnectionSuccess(),
      averageLatency: this.calculateAverageLatency(),
      reconnectAttempts: this.calculateReconnectAttempts(),
      errorFrequency: this.calculateErrorFrequency()
    };

    return {
      realTimeMetrics,
      historicalData: {
        dailyConnectionStats: this.connectionStats,
        networkSwitches: this.networkSwitches,
        permissionUsage: this.permissionUsage
      }
    };
  }

  private calculateConnectionSuccess(): number {
    let total = 0;
    let successful = 0;
    this.metrics.forEach(metrics => {
      total += metrics.totalRequests;
      successful += metrics.successfulRequests;
    });
    return total > 0 ? successful / total : 0;
  }

  private calculateAverageLatency(): number {
    let total = 0;
    let count = 0;
    this.metrics.forEach(metrics => {
      total += metrics.averageLatency;
      count++;
    });
    return count > 0 ? total / count : 0;
  }

  private calculateReconnectAttempts(): number {
    return this.connectionStats.reduce((sum, stats) => sum + stats.errorCount, 0);
  }

  private calculateErrorFrequency(): Record<string, number> {
    const errorFrequency: Record<string, number> = {};
    this.metrics.forEach((metrics, origin) => {
      errorFrequency[origin] = metrics.errorRate;
    });
    return errorFrequency;
  }
} 