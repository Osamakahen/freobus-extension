import { EventEmitter } from 'events';

interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  resourceUsage: number;
  efficiencyScore: number;
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

interface MetricsEvent {
  type: string;
  metrics: PerformanceMetrics;
  suggestions: string[];
  performanceScore: number;
  timestamp: number;
}

interface ResourceEvent {
  type: string;
  usage: ResourceUsage;
  efficiencyScore: number;
  optimizationOpportunities: string[];
  timestamp: number;
}

export class PerformanceVisualizer extends EventEmitter {
  private static readonly UPDATE_INTERVAL = 1000;
  private static readonly METRIC_THRESHOLDS = {
    responseTime: 100,
    successRate: 0.95,
    resourceUsage: 0.8
  };

  private metrics: Map<string, PerformanceMetrics> = new Map();
  private resourceUsage: Map<string, ResourceUsage> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMetricsCollection();
  }

  public async showPerformanceMetrics(): Promise<void> {
    const metrics = await this.collectMetrics();
    const optimizationSuggestions = await this.generateOptimizationSuggestions(metrics);
    
    this.emit('metricsUpdate', {
      type: 'metricsUpdate',
      metrics,
      suggestions: optimizationSuggestions,
      performanceScore: this.calculatePerformanceScore(metrics),
      timestamp: Date.now()
    } as MetricsEvent);
  }

  public async showResourceUsage(): Promise<void> {
    const usage = await this.collectResourceUsage();
    const efficiencyScore = this.calculateEfficiencyScore(usage);
    
    this.emit('resourceUpdate', {
      type: 'resourceUpdate',
      usage,
      efficiencyScore,
      optimizationOpportunities: this.identifyOptimizationOpportunities(usage),
      timestamp: Date.now()
    } as ResourceEvent);
  }

  private startMetricsCollection(): void {
    this.updateInterval = setInterval(async () => {
      await this.showPerformanceMetrics();
      await this.showResourceUsage();
    }, PerformanceVisualizer.UPDATE_INTERVAL);
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    return {
      responseTime: await this.measureResponseTime(),
      successRate: await this.calculateSuccessRate(),
      resourceUsage: await this.calculateResourceUsage(),
      efficiencyScore: await this.calculateEfficiencyScore(await this.collectResourceUsage())
    };
  }

  private async collectResourceUsage(): Promise<ResourceUsage> {
    return {
      cpu: await this.measureCPUUsage(),
      memory: await this.measureMemoryUsage(),
      network: await this.measureNetworkUsage(),
      storage: await this.measureStorageUsage()
    };
  }

  private async generateOptimizationSuggestions(metrics: PerformanceMetrics): Promise<string[]> {
    const suggestions: string[] = [];

    if (metrics.responseTime > PerformanceVisualizer.METRIC_THRESHOLDS.responseTime) {
      suggestions.push('Consider optimizing response time by implementing caching');
    }

    if (metrics.successRate < PerformanceVisualizer.METRIC_THRESHOLDS.successRate) {
      suggestions.push('Review error handling and retry mechanisms');
    }

    if (metrics.resourceUsage > PerformanceVisualizer.METRIC_THRESHOLDS.resourceUsage) {
      suggestions.push('Optimize resource usage by implementing better cleanup');
    }

    return suggestions;
  }

  private identifyOptimizationOpportunities(usage: ResourceUsage): string[] {
    const opportunities: string[] = [];

    if (usage.cpu > 0.8) {
      opportunities.push('High CPU usage detected - consider optimizing heavy computations');
    }

    if (usage.memory > 0.8) {
      opportunities.push('High memory usage detected - implement better memory management');
    }

    if (usage.network > 0.8) {
      opportunities.push('High network usage detected - implement request batching');
    }

    if (usage.storage > 0.8) {
      opportunities.push('High storage usage detected - implement data cleanup');
    }

    return opportunities;
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    const responseTimeScore = 1 - (metrics.responseTime / 1000);
    const successRateScore = metrics.successRate;
    const resourceUsageScore = 1 - metrics.resourceUsage;

    return (
      responseTimeScore * 0.4 +
      successRateScore * 0.4 +
      resourceUsageScore * 0.2
    );
  }

  private calculateEfficiencyScore(usage: ResourceUsage): number {
    return (
      (1 - usage.cpu) * 0.3 +
      (1 - usage.memory) * 0.3 +
      (1 - usage.network) * 0.2 +
      (1 - usage.storage) * 0.2
    );
  }

  private async measureResponseTime(): Promise<number> {
    // Implementation of response time measurement
    return 150;
  }

  private async calculateSuccessRate(): Promise<number> {
    // Implementation of success rate calculation
    return 0.95;
  }

  private async calculateResourceUsage(): Promise<number> {
    // Implementation of resource usage calculation
    return 0.7;
  }

  private async measureCPUUsage(): Promise<number> {
    // Implementation of CPU usage measurement
    return 0.6;
  }

  private async measureMemoryUsage(): Promise<number> {
    // Implementation of memory usage measurement
    return 0.5;
  }

  private async measureNetworkUsage(): Promise<number> {
    // Implementation of network usage measurement
    return 0.4;
  }

  private async measureStorageUsage(): Promise<number> {
    // Implementation of storage usage measurement
    return 0.3;
  }

  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
} 