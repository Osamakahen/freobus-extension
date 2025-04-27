export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
}

export interface ResourceUsage {
  activeConnections: number;
  cacheSize: number;
}

class PerformanceService {
  getMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0
    };
  }

  getResourceUsage(): ResourceUsage {
    return {
      activeConnections: 0,
      cacheSize: 0
    };
  }
}

export const performanceService = new PerformanceService(); 