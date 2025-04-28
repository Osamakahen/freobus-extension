import { EventEmitter } from 'events';

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  activeConnections: number;
  cacheSize: number;
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
}

class PerformanceService extends EventEmitter {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    cacheSize: 0
  };

  private constructor() {
    super();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  public async getMetrics(): Promise<PerformanceMetrics> {
    // In a real implementation, this would collect actual metrics
    // For now, we'll return mock data
    this.metrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkLatency: Math.random() * 1000,
      activeConnections: Math.floor(Math.random() * 100),
      cacheSize: Math.floor(Math.random() * 1000)
    };

    this.emit('metricsUpdate', this.metrics);
    return this.metrics;
  }

  public async getResourceUsage(): Promise<ResourceUsage> {
    // In a real implementation, this would collect actual resource usage
    // For now, we'll return mock data
    const usage: ResourceUsage = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 100
    };

    this.emit('resourceUpdate', usage);
    return usage;
  }
}

export const performanceService = PerformanceService.getInstance(); 