import { EventEmitter } from 'events';

interface AnimationConfig {
  duration: number;
  easing: string;
  color: string;
}

interface ConnectionMetrics {
  successRate: number;
  averageResponseTime: number;
  reliabilityScore: number;
}

interface FeedbackEvent {
  type: string;
  origin?: string;
  metrics?: ConnectionMetrics;
  animation?: AnimationConfig;
  chainId?: string;
  health?: number;
  txData?: any;
  gasEstimate?: number;
  successProbability?: number;
}

export class VisualFeedbackManager extends EventEmitter {
  private static readonly ANIMATION_DURATION = 500;
  private static readonly SUCCESS_COLOR = '#4CAF50';
  private static readonly ERROR_COLOR = '#F44336';
  private static readonly WARNING_COLOR = '#FFC107';

  private metrics: Map<string, ConnectionMetrics> = new Map();
  private activeAnimations: Map<string, AnimationConfig> = new Map();

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on('connectionSuccess', this.handleConnectionSuccess);
    this.on('connectionError', this.handleConnectionError);
    this.on('networkSwitch', this.handleNetworkSwitch);
    this.on('transactionSuccess', this.handleTransactionSuccess);
  }

  public async showConnectionSuccess(origin: string): Promise<void> {
    const metrics = await this.calculateConnectionMetrics();
    this.metrics.set(origin, metrics);

    const animation: AnimationConfig = {
      duration: VisualFeedbackManager.ANIMATION_DURATION,
      easing: 'ease-out',
      color: VisualFeedbackManager.SUCCESS_COLOR
    };

    this.activeAnimations.set(origin, animation);
    this.emit('showFeedback', {
      type: 'connectionSuccess',
      origin,
      metrics,
      animation
    } as FeedbackEvent);
  }

  public async showNetworkSwitch(chainId: string): Promise<void> {
    const networkHealth = await this.calculateNetworkHealth();
    
    this.emit('showFeedback', {
      type: 'networkSwitch',
      chainId,
      health: networkHealth,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: networkHealth > 0.8 ? VisualFeedbackManager.SUCCESS_COLOR : 
               networkHealth > 0.5 ? VisualFeedbackManager.WARNING_COLOR : 
               VisualFeedbackManager.ERROR_COLOR
      }
    } as FeedbackEvent);
  }

  public async showTransactionPreview(txData: any): Promise<void> {
    const gasEstimate = await this.estimateGas();
    const successProbability = await this.calculateSuccessProbability();

    this.emit('showFeedback', {
      type: 'transactionPreview',
      txData,
      gasEstimate,
      successProbability,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: successProbability > 0.9 ? VisualFeedbackManager.SUCCESS_COLOR :
               successProbability > 0.7 ? VisualFeedbackManager.WARNING_COLOR :
               VisualFeedbackManager.ERROR_COLOR
      }
    } as FeedbackEvent);
  }

  public async showTransactionPending(txData: any): Promise<void> {
    this.emit('showFeedback', {
      type: 'transactionPending',
      txData,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.WARNING_COLOR
      }
    } as FeedbackEvent);
  }

  public async showTransactionSuccess(txData: any): Promise<void> {
    this.emit('showFeedback', {
      type: 'transactionSuccess',
      txData,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.SUCCESS_COLOR
      }
    } as FeedbackEvent);
  }

  public async showError(message: string): Promise<void> {
    this.emit('showFeedback', {
      type: 'error',
      message,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.ERROR_COLOR
      }
    } as FeedbackEvent);
  }

  public async showWarning(message: string): Promise<void> {
    this.emit('showFeedback', {
      type: 'warning',
      message,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.WARNING_COLOR
      }
    } as FeedbackEvent);
  }

  public async showInfo(message: string): Promise<void> {
    this.emit('showFeedback', {
      type: 'info',
      message,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.WARNING_COLOR
      }
    } as FeedbackEvent);
  }

  public async showSuccess(message: string): Promise<void> {
    this.emit('showFeedback', {
      type: 'success',
      message,
      animation: {
        duration: VisualFeedbackManager.ANIMATION_DURATION,
        easing: 'ease-in-out',
        color: VisualFeedbackManager.SUCCESS_COLOR
      }
    } as FeedbackEvent);
  }

  private async calculateConnectionMetrics(): Promise<ConnectionMetrics> {
    return {
      successRate: 0.95,
      averageResponseTime: 150,
      reliabilityScore: 0.9
    }
  }

  private async calculateNetworkHealth(): Promise<number> {
    return 0.85
  }

  private async estimateGas(): Promise<number> {
    return 21000
  }

  private async calculateSuccessProbability(): Promise<number> {
    return 0.95
  }

  private handleConnectionSuccess(event: FeedbackEvent): void {
    // Handle connection success event
    console.log('Connection success:', event);
  }

  private handleConnectionError(event: FeedbackEvent): void {
    // Handle connection error event
    console.log('Connection error:', event);
  }

  private handleNetworkSwitch(event: FeedbackEvent): void {
    // Handle network switch event
    console.log('Network switch:', event);
  }

  private handleTransactionSuccess(event: FeedbackEvent): void {
    // Handle transaction success event
    console.log('Transaction success:', event);
  }

  public showConnectionStatus(): void {
    this.emit('showFeedback', { type: 'connectionStatus' })
  }

  public showNetworkStatus(): void {
    this.emit('showFeedback', { type: 'networkStatus' })
  }

  public showTransactionStatus(): void {
    this.emit('showFeedback', { type: 'transactionStatus' })
  }

  public showTransactionError(): void {
    this.emit('showFeedback', { type: 'transactionError' })
  }
} 