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

  public async verifySession(origin: string, auth: SessionAuth): Promise<boolean> {
    if (auth.expiresAt < Date.now()) {
      return false;
    }

    if (this.config.enableEIP4361) {
      return this.verifyEIP4361Signature(auth);
    }

    return true;
  }

  public async handleConnectionFailure(origin: string): Promise<number> {
    const attempts = (this.retryAttempts.get(origin) || 0) + 1;
    this.retryAttempts.set(origin, attempts);

    if (attempts >= this.config.maxRetryAttempts) {
      this.emit('maxRetriesExceeded', { origin, attempts });
      return -1;
    }

    const delay = this.calculateBackoffDelay(origin);
    this.backoffDelays.set(origin, delay);
    
    this.emit('retryScheduled', { origin, attempts, delay });
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
    // Implementation would depend on the wallet provider
    // This is a placeholder for the actual implementation
    return '';
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
  }
} 