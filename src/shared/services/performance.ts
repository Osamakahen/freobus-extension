import { EventEmitter } from 'events'

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
}

export interface ResourceUsage {
  activeConnections: number;
  cacheSize: number;
}

export interface MetricsEvent {
  type: string
  metrics: any
}

export interface ResourceEvent {
  type: string
  usage: any
}

export class PerformanceService extends EventEmitter {
  private metricsInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  public startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics()
      const usage = this.getResourceUsage()
      this.emit('metricsUpdate', { type: 'metrics', metrics })
      this.emit('resourceUpdate', { type: 'resources', usage })
    }, 1000)
  }

  public stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  private getMetrics() {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0
    }
  }

  private getResourceUsage() {
    return {
      activeConnections: 0,
      cacheSize: 0
    }
  }
}

export const performanceService = new PerformanceService() 