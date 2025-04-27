import { EventEmitter } from 'events';

interface TabMessage {
  type: 'STATE_UPDATE' | 'SESSION_UPDATE' | 'NETWORK_UPDATE' | 'LOCK_REQUEST' | 'LOCK_RELEASE';
  payload: any;
  timestamp: number;
  tabId: string;
}

export class TabCoordinator extends EventEmitter {
  private static readonly CHANNEL_NAME = 'freobus-wallet-coordination';
  private static readonly LOCK_TIMEOUT = 5000; // 5 seconds
  private static readonly HEARTBEAT_INTERVAL = 1000; // 1 second

  private channel: BroadcastChannel;
  private tabId: string;
  private isLeader: boolean = false;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lockTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.tabId = Math.random().toString(36).substring(2, 15);
    this.channel = new BroadcastChannel(TabCoordinator.CHANNEL_NAME);
    this.setupListeners();
    this.startHeartbeat();
  }

  private setupListeners(): void {
    this.channel.addEventListener('message', (event: MessageEvent) => {
      const message: TabMessage = event.data;
      
      if (message.tabId === this.tabId) return; // Ignore own messages

      switch (message.type) {
        case 'STATE_UPDATE':
          this.emit('stateUpdate', message.payload);
          break;
        case 'SESSION_UPDATE':
          this.emit('sessionUpdate', message.payload);
          break;
        case 'NETWORK_UPDATE':
          this.emit('networkUpdate', message.payload);
          break;
        case 'LOCK_REQUEST':
          this.handleLockRequest(message);
          break;
        case 'LOCK_RELEASE':
          this.handleLockRelease(message);
          break;
      }
    });

    // Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.releaseLock();
      } else {
        this.requestLock();
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      if (this.isLeader) {
        this.broadcastMessage('STATE_UPDATE', { timestamp: this.lastHeartbeat });
      }
    }, TabCoordinator.HEARTBEAT_INTERVAL);
  }

  public async requestLock(): Promise<boolean> {
    return new Promise((resolve) => {
      this.broadcastMessage('LOCK_REQUEST', { tabId: this.tabId });
      
      // Set a timeout for the lock request
      setTimeout(() => {
        if (!this.isLeader) {
          this.isLeader = true;
          this.emit('lockAcquired');
          resolve(true);
        }
      }, TabCoordinator.LOCK_TIMEOUT);
    });
  }

  private handleLockRequest(message: TabMessage): void {
    if (this.isLeader) {
      // If we're the leader, respond to the request
      this.broadcastMessage('LOCK_RELEASE', { tabId: this.tabId });
      this.isLeader = false;
      this.emit('lockReleased');
    }
  }

  private handleLockRelease(message: TabMessage): void {
    if (message.tabId === this.tabId) {
      this.isLeader = true;
      this.emit('lockAcquired');
    }
  }

  public releaseLock(): void {
    if (this.isLeader) {
      this.broadcastMessage('LOCK_RELEASE', { tabId: this.tabId });
      this.isLeader = false;
      this.emit('lockReleased');
    }
  }

  public broadcastStateUpdate(state: any): void {
    this.broadcastMessage('STATE_UPDATE', state);
  }

  public broadcastSessionUpdate(session: any): void {
    this.broadcastMessage('SESSION_UPDATE', session);
  }

  public broadcastNetworkUpdate(network: any): void {
    this.broadcastMessage('NETWORK_UPDATE', network);
  }

  private broadcastMessage(type: TabMessage['type'], payload: any): void {
    const message: TabMessage = {
      type,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId
    };
    this.channel.postMessage(message);
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }
    this.releaseLock();
    this.channel.close();
  }
} 