import { EventEmitter } from 'events';
import { utils } from 'ethers';

interface SecurityConfig {
  enableHardwareAuth: boolean;
  enableEIP4361: boolean;
  maxRetryAttempts: number;
  backoffMultiplier: number;
  initialBackoffDelay: number;
}

interface SessionAuth {
  origin: string;
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

interface SessionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  errorRate: number;
  lastUpdated: number;
}

interface HealthMetrics {
  latency: number;
  errorRate: number;
  lastSuccessfulRequest: number;
  connectionStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export class SessionSecurityManager extends EventEmitter {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableHardwareAuth: false,
    enableEIP4361: true,
    maxRetryAttempts: 5,
    backoffMultiplier: 2,
    initialBackoffDelay: 1000
  };

  private config: SecurityConfig;
  private authSessions: Map<string, SessionAuth> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private backoffDelays: Map<string, number> = new Map();
  private sessions: Map<string, any> = new Map();
  private metrics: Map<string, SessionMetrics> = new Map();
  private healthSubscribers: Map<string, Set<(metrics: HealthMetrics) => void>> = new Map();
  private analyticsSubscribers: Set<(origin: string, metrics: SessionMetrics) => void> = new Set();

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    this.config = { ...SessionSecurityManager.DEFAULT_CONFIG, ...config };
  }

  public async authenticateSession(origin: string, address: string): Promise<SessionAuth> {
    if (this.config.enableEIP4361) {
      return this.authenticateWithEIP4361(origin, address);
    }
    return this.authenticateWithBasicAuth(origin, address);
  }

  public async verifySession(auth: SessionAuth): Promise<boolean> {
    if (auth.expiresAt < Date.now()) {
      return false;
    }

    if (this.config.enableEIP4361) {
      return this.verifyEIP4361Signature(auth);
    }

    return true;
  }

  public async handleConnectionFailure(): Promise<number> {
    const attempts = (this.retryAttempts.get('default') || 0) + 1;
    this.retryAttempts.set('default', attempts);

    if (attempts >= this.config.maxRetryAttempts) {
      this.emit('maxRetriesExceeded', { origin: 'default', attempts });
      return -1;
    }

    const delay = this.calculateBackoffDelay('default');
    this.backoffDelays.set('default', delay);
    
    this.emit('retryScheduled', { origin: 'default', attempts, delay });
    return delay;
  }

  private async authenticateWithEIP4361(origin: string, address: string): Promise<SessionAuth> {
    const message = this.generateEIP4361Message(origin, address);
    const signature = await this.requestSignature(address, message);
    
    const auth: SessionAuth = {
      origin,
      address,
      message,
      signature,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    this.authSessions.set(origin, auth);
    return auth;
  }

  private async authenticateWithBasicAuth(origin: string, address: string): Promise<SessionAuth> {
    const auth: SessionAuth = {
      origin,
      address,
      message: '',
      signature: '',
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    this.authSessions.set(origin, auth);
    return auth;
  }

  private async verifyEIP4361Signature(auth: SessionAuth): Promise<boolean> {
    try {
      const recoveredAddress = utils.verifyMessage(auth.message, auth.signature);
      return recoveredAddress.toLowerCase() === auth.address.toLowerCase();
    } catch (error) {
      this.emit('signatureVerificationFailed', { error, auth });
      return false;
    }
  }

  private generateEIP4361Message(origin: string, address: string): string {
    const timestamp = new Date().toISOString();
    return `${origin} wants you to sign in with your Ethereum account:\n${address}\n\nURI: ${origin}\nVersion: 1\nChain ID: 1\nNonce: ${Math.random().toString(36).substring(2)}\nIssued At: ${timestamp}`;
  }

  private async requestSignature(address: string, message: string): Promise<string> {
    try {
      // Implementation would depend on the wallet provider
      console.log('Requesting signature for:', { address, message })
      return 'mock_signature'
    } catch (error) {
      console.error('Signature request failed:', error)
      throw new Error('Failed to request signature')
    }
  }

  private calculateBackoffDelay(origin: string): number {
    const attempts = this.retryAttempts.get(origin) || 0;
    const currentDelay = this.backoffDelays.get(origin) || this.config.initialBackoffDelay;
    return currentDelay * Math.pow(this.config.backoffMultiplier, attempts);
  }

  public cleanup(): void {
    this.authSessions.clear();
    this.retryAttempts.clear();
    this.backoffDelays.clear();
    this.sessions.clear();
    this.metrics.clear();
    this.healthSubscribers.clear();
    this.analyticsSubscribers.clear();
  }

  public subscribeToHealth(origin: string, callback: (metrics: HealthMetrics) => void): () => void {
    if (!this.healthSubscribers.has(origin)) {
      this.healthSubscribers.set(origin, new Set());
    }
    this.healthSubscribers.get(origin)?.add(callback);

    return () => {
      this.healthSubscribers.get(origin)?.delete(callback);
    };
  }

  public subscribeToAnalytics(callback: (origin: string, metrics: SessionMetrics) => void): () => void {
    this.analyticsSubscribers.add(callback);

    return () => {
      this.analyticsSubscribers.delete(callback);
    };
  }

  public updateMetrics(origin: string, success: boolean, latency: number): void {
    const currentMetrics = this.metrics.get(origin) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };

    currentMetrics.totalRequests++;
    if (success) {
      currentMetrics.successfulRequests++;
    } else {
      currentMetrics.failedRequests++;
    }

    // Update average latency using exponential moving average
    currentMetrics.averageLatency = (currentMetrics.averageLatency * 0.9) + (latency * 0.1);
    currentMetrics.errorRate = currentMetrics.failedRequests / currentMetrics.totalRequests;
    currentMetrics.lastUpdated = Date.now();

    this.metrics.set(origin, currentMetrics);

    // Notify health subscribers
    const healthMetrics: HealthMetrics = {
      latency: currentMetrics.averageLatency,
      errorRate: currentMetrics.errorRate,
      lastSuccessfulRequest: success ? Date.now() : currentMetrics.lastUpdated,
      connectionStatus: this.determineHealthStatus(currentMetrics)
    };

    this.healthSubscribers.get(origin)?.forEach(callback => {
      callback(healthMetrics);
    });

    // Notify analytics subscribers
    this.analyticsSubscribers.forEach(callback => {
      callback(origin, currentMetrics);
    });
  }

  private determineHealthStatus(metrics: SessionMetrics): 'healthy' | 'degraded' | 'unhealthy' {
    if (metrics.errorRate > 0.5 || metrics.averageLatency > 1000) return 'unhealthy';
    if (metrics.errorRate > 0.1 || metrics.averageLatency > 500) return 'degraded';
    return 'healthy';
  }

  public getMetrics(origin: string): SessionMetrics | undefined {
    return this.metrics.get(origin);
  }

  public getAllMetrics(): Record<string, SessionMetrics> {
    return Object.fromEntries(this.metrics);
  }
} 