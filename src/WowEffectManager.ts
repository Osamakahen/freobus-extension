import { EventEmitter } from 'events';
import { VisualFeedbackManager } from './visual-feedback/VisualFeedbackManager';
import { SmartSuggestionManager } from './smart-suggestions/SmartSuggestionManager';
import { performanceService } from './shared/services/performanceService';

interface WowEffectConfig {
  enableAnimations: boolean;
  enableSuggestions: boolean;
  enablePerformanceMetrics: boolean;
  animationDuration: number;
  suggestionThreshold: number;
  metricsUpdateInterval: number;
}

interface VisualFeedbackEvent {
  type: string;
  data: any;
}

interface SuggestionEvent {
  type: string;
  suggestions: any[];
}

interface MetricsEvent {
  type: string;
  metrics: any;
}

interface ResourceEvent {
  type: string;
  usage: any;
}

export class WowEffectManager extends EventEmitter {
  private visualFeedback: VisualFeedbackManager;
  private smartSuggestions: SmartSuggestionManager;
  private config: WowEffectConfig;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<WowEffectConfig> = {}) {
    super();
    this.config = {
      enableAnimations: true,
      enableSuggestions: true,
      enablePerformanceMetrics: true,
      animationDuration: 500,
      suggestionThreshold: 0.7,
      metricsUpdateInterval: 1000,
      ...config
    };

    this.visualFeedback = new VisualFeedbackManager();
    this.smartSuggestions = new SmartSuggestionManager();
  }

  public async initialize(): Promise<void> {
    if (this.config.enableAnimations) {
      await this.setupVisualFeedback();
    }

    if (this.config.enableSuggestions) {
      await this.setupSmartSuggestions();
    }

    if (this.config.enablePerformanceMetrics) {
      await this.setupPerformanceMetrics();
    }
  }

  public async handleConnection(origin: string): Promise<void> {
    if (this.config.enableAnimations) {
      await this.visualFeedback.showConnectionSuccess(origin);
    }

    if (this.config.enableSuggestions) {
      const suggestions = await this.smartSuggestions.getDAppSuggestions();
      this.emit('suggestions', {
        type: 'suggestions',
        suggestions
      } as SuggestionEvent);
    }
  }

  public async handleNetworkSwitch(chainId: string): Promise<void> {
    if (this.config.enableAnimations) {
      await this.visualFeedback.showNetworkSwitch(chainId);
    }

    if (this.config.enableSuggestions) {
      const suggestions = await this.smartSuggestions.getNetworkSuggestions(chainId);
      this.emit('suggestions', {
        type: 'suggestions',
        suggestions
      } as SuggestionEvent);
    }
  }

  public async handleTransaction(txData: any): Promise<void> {
    if (this.config.enableAnimations) {
      await this.visualFeedback.showTransactionPreview(txData);
    }

    if (this.config.enablePerformanceMetrics) {
      const metrics = await performanceService.getMetrics();
      const resourceUsage = await performanceService.getResourceUsage();
      
      this.emit('metrics', {
        type: 'metrics',
        metrics
      } as MetricsEvent);

      this.emit('resources', {
        type: 'resources',
        usage: resourceUsage
      } as ResourceEvent);
    }
  }

  private async setupVisualFeedback(): Promise<void> {
    this.visualFeedback.on('showFeedback', (data: VisualFeedbackEvent) => {
      this.emit('visualFeedback', data);
    });
  }

  private async setupSmartSuggestions(): Promise<void> {
    this.smartSuggestions.on('suggestionUpdate', (data: SuggestionEvent) => {
      this.emit('suggestions', data);
    });
  }

  private async setupPerformanceMetrics(): Promise<void> {
    this.metricsInterval = setInterval(async () => {
      const metrics = await performanceService.getMetrics();
      const resourceUsage = await performanceService.getResourceUsage();
      
      this.emit('metrics', {
        type: 'metrics',
        metrics
      } as MetricsEvent);

      this.emit('resources', {
        type: 'resources',
        usage: resourceUsage
      } as ResourceEvent);
    }, this.config.metricsUpdateInterval);
  }

  public cleanup(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
} 