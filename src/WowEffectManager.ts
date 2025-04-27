import { EventEmitter } from 'events';
import { VisualFeedbackManager } from './visual-feedback/VisualFeedbackManager';
import { SmartSuggestionManager } from './smart-suggestions/SmartSuggestionManager';
import { PerformanceVisualizer } from './performance/PerformanceVisualizer';

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
  private performanceVisualizer: PerformanceVisualizer;
  private config: WowEffectConfig;

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
    this.performanceVisualizer = new PerformanceVisualizer();
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
      await this.performanceVisualizer.showPerformanceMetrics();
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
    this.performanceVisualizer.on('metricsUpdate', (data: MetricsEvent) => {
      this.emit('metrics', data);
    });

    this.performanceVisualizer.on('resourceUpdate', (data: ResourceEvent) => {
      this.emit('resources', data);
    });
  }

  public cleanup(): void {
    this.performanceVisualizer.cleanup();
  }
} 