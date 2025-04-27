import { EventEmitter } from 'events';
import { WalletError } from '../types';

interface RetryConfig {
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitterFactor: number;
  maxAttempts: number;
}

export class ConnectionRetryManager extends EventEmitter {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    initialDelay: 500, // Start with 500ms
    maxDelay: 30000, // Cap at 30 seconds
    backoffFactor: 1.5, // Each retry is 1.5x longer
    jitterFactor: 0.2, // Add ±20% randomness
    maxAttempts: 10
  };

  private config: RetryConfig;
  private retryAttempts: Map<string, number> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = { ...ConnectionRetryManager.DEFAULT_CONFIG, ...config };
  }

  public async retryConnection<T>(
    origin: string,
    operation: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T> {
    const attempt = (this.retryAttempts.get(origin) || 0) + 1;
    this.retryAttempts.set(origin, attempt);

    if (attempt > this.config.maxAttempts) {
      this.emit('maxRetriesExceeded', { origin, attempt });
      throw new WalletError(
        'MAX_RETRIES_EXCEEDED',
        `Maximum retry attempts (${this.config.maxAttempts}) exceeded for ${origin}`
      );
    }

    try {
      const result = await operation();
      this.clearRetryState(origin);
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }

      const delay = this.calculateDelay(attempt);
      this.emit('retryScheduled', { origin, attempt, delay });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            const result = await this.retryConnection(origin, operation, onError);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);

        this.retryTimeouts.set(origin, timeout);
      });
    }
  }

  private calculateDelay(attempt: number): number {
    // Calculate base delay with exponential backoff
    const baseDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1),
      this.config.maxDelay
    );

    // Add jitter to prevent "thundering herd" problem
    const jitterRange = baseDelay * this.config.jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterRange; // Random value between -jitterRange and +jitterRange

    return Math.max(0, baseDelay + jitter);
  }

  private clearRetryState(origin: string): void {
    // Clear timeout if it exists
    const timeout = this.retryTimeouts.get(origin);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(origin);
    }

    // Reset attempt counter
    this.retryAttempts.delete(origin);
  }

  public cleanup(): void {
    // Clear all timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.retryAttempts.clear();
  }
} 