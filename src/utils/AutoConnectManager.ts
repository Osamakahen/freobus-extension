import { EventEmitter } from 'events';

interface ConnectionAttempt {
  attempt: number;
  lastAttempt: number;
  nextAttempt: number;
}

export class EnhancedAutoConnectManager extends EventEmitter {
  private attempts: Map<string, ConnectionAttempt> = new Map();
  private maxAttempts: number = 5;
  private maxDelay: number = 30000; // 30 seconds
  private baseDelay: number = 1000; // 1 second

  constructor() {
    super();
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = Math.min(
      this.baseDelay * Math.pow(1.5, attempt - 1),
      this.maxDelay
    );
    
    // Add ±20% jitter
    return baseDelay * (0.8 + Math.random() * 0.4);
  }

  public async retryConnection(
    origin: string,
    connectFn: () => Promise<any>
  ): Promise<any> {
    const attempt = this.attempts.get(origin) || {
      attempt: 0,
      lastAttempt: Date.now(),
      nextAttempt: Date.now()
    };

    if (attempt.attempt >= this.maxAttempts) {
      this.emit('maxRetriesExceeded', { origin, attempt: attempt.attempt });
      throw new Error('Maximum retry attempts exceeded');
    }

    try {
      const result = await connectFn();
      this.attempts.delete(origin);
      return result;
    } catch (error) {
      attempt.attempt++;
      const delay = this.calculateRetryDelay(attempt.attempt);
      attempt.nextAttempt = Date.now() + delay;
      this.attempts.set(origin, attempt);

      this.emit('retryScheduled', {
        origin,
        attempt: attempt.attempt,
        delay,
        nextAttempt: attempt.nextAttempt
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryConnection(origin, connectFn);
    }
  }

  public getConnectionStatus(origin: string) {
    const attempt = this.attempts.get(origin);
    if (!attempt) return null;

    return {
      attempt: attempt.attempt,
      lastAttempt: attempt.lastAttempt,
      nextAttempt: attempt.nextAttempt,
      maxAttempts: this.maxAttempts
    };
  }

  public resetConnection(origin: string) {
    this.attempts.delete(origin);
  }
} 