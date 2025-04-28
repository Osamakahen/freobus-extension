import { EventEmitter } from 'events';

interface TabMessage {
  type: 'STATE_UPDATE' | 'SESSION_UPDATE' | 'NETWORK_UPDATE' | 'LOCK_REQUEST' | 'LOCK_RELEASE' | 'HEARTBEAT' | 'LEADERSHIP_CLAIM' | 'LEADERSHIP_RESPONSE';
  payload: any;
  timestamp: number;
  tabId: string;
  claimingTabId?: string;
  retainsLeadership?: boolean;
}

export class TabCoordinator extends EventEmitter {
  private static readonly CHANNEL_NAME = 'freobus-wallet-coordination';
  private static readonly LOCK_TIMEOUT = 5000; // 5 seconds
  private static readonly HEARTBEAT_INTERVAL = 1000; // 1 second
  private static readonly LEADERSHIP_CLAIM_INTERVAL = 2000; // 2 seconds
  private static readonly INACTIVITY_THRESHOLD = 30000; // 30 seconds

  private channel: BroadcastChannel;
  private tabId: string;
  private isLeader: boolean = false;
  private leaderTabId: string | null = null;
  private lastHeartbeat: number = 0;
  private lastActiveTimestamp: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private leadershipInterval: NodeJS.Timeout | null = null;
  private lockTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.tabId = crypto.randomUUID();
    this.channel = new BroadcastChannel(TabCoordinator.CHANNEL_NAME);
    this.setupListeners();
    this.startHeartbeat();
    this.startLeadershipElection();
    this.setupActivityTracking();
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
          this.handleLockRequest();
          break;
        case 'LOCK_RELEASE':
          this.handleLockRelease(message);
          break;
        case 'HEARTBEAT':
          this.handleHeartbeat(message);
          break;
        case 'LEADERSHIP_CLAIM':
          this.handleLeadershipClaim(message);
          break;
        case 'LEADERSHIP_RESPONSE':
          this.handleLeadershipResponse(message);
          break;
      }
    });

    // Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.releaseLock();
      } else {
        this.requestLock();
        this.requestStateSync();
      }
    });
  }

  private setupActivityTracking(): void {
    ['click', 'keydown', 'mousemove'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.lastActiveTimestamp = Date.now();
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      if (this.isLeader) {
        this.broadcastMessage('HEARTBEAT', { timestamp: this.lastHeartbeat });
      }
    }, TabCoordinator.HEARTBEAT_INTERVAL);
  }

  private startLeadershipElection(): void {
    this.leadershipInterval = setInterval(() => {
      if (!this.leaderTabId || Date.now() - this.lastHeartbeat > TabCoordinator.INACTIVITY_THRESHOLD) {
        this.claimLeadership();
      }
    }, TabCoordinator.LEADERSHIP_CLAIM_INTERVAL);
  }

  private handleHeartbeat(message: TabMessage): void {
    if (message.tabId === this.leaderTabId) {
      this.lastHeartbeat = message.timestamp;
    }
  }

  private handleLeadershipClaim(message: TabMessage): void {
    if (message.tabId !== this.tabId) {
      const isOtherTabMoreActive = message.timestamp > this.lastActiveTimestamp;
      
      if (this.isLeader && !isOtherTabMoreActive) {
        // Keep leadership but notify the other tab
        this.broadcastMessage('LEADERSHIP_RESPONSE', {
          claimingTabId: message.tabId,
          retainsLeadership: true
        });
      } else if (isOtherTabMoreActive) {
        // Give up leadership
        this.isLeader = false;
        this.leaderTabId = message.tabId;
        this.emit('leadershipChanged', { newLeader: message.tabId });
      }
    }
  }

  private handleLeadershipResponse(message: TabMessage): void {
    if (message.claimingTabId === this.tabId && !message.retainsLeadership) {
      this.isLeader = true;
      this.leaderTabId = this.tabId;
      this.emit('leadershipAcquired');
    }
  }

  private claimLeadership(): void {
    this.broadcastMessage('LEADERSHIP_CLAIM', {
      timestamp: this.lastActiveTimestamp
    });
  }

  public async requestLock(): Promise<boolean> {
    return new Promise((resolve) => {
      this.broadcastMessage('LOCK_REQUEST', { tabId: this.tabId });
      
      // Set a timeout for the lock request
      this.lockTimeout = setTimeout(() => {
        if (!this.isLeader) {
          this.isLeader = true;
          this.leaderTabId = this.tabId;
          this.emit('lockAcquired');
          resolve(true);
        }
      }, TabCoordinator.LOCK_TIMEOUT);
    });
  }

  private handleLockRequest(): void {
    // Handle lock request
  }

  private handleLockRelease(message: TabMessage): void {
    if (message.tabId === this.tabId) {
      this.isLeader = true;
      this.leaderTabId = this.tabId;
      this.emit('lockAcquired');
    }
  }

  public releaseLock(): void {
    if (this.isLeader) {
      this.broadcastMessage('LOCK_RELEASE', { tabId: this.tabId });
      this.isLeader = false;
      this.leaderTabId = null;
      this.emit('lockReleased');
    }
  }

  public requestStateSync(): void {
    if (this.leaderTabId) {
      this.broadcastMessage('STATE_UPDATE', { requestingTabId: this.tabId });
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
    try {
      const message: TabMessage = {
        type,
        payload,
        timestamp: Date.now(),
        tabId: this.tabId
      };
      this.channel.postMessage(message);
    } catch (error) {
      console.error('Message broadcasting failed:', error);
      throw new Error('Failed to broadcast message');
    }
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.leadershipInterval) {
      clearInterval(this.leadershipInterval);
    }
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }
    this.releaseLock();
    this.channel.close();
  }

  public handleTabMessage(): void {
    // Handle tab message
  }
} 