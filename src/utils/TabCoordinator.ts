import { EventEmitter } from 'events';

interface TabState {
  isLeader: boolean;
  lastActive: number;
  sessionId: string;
}

export class TabCoordinator extends EventEmitter {
  private channel: BroadcastChannel;
  private state: TabState;
  private leaderTimeout: number = 5000; // 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.channel = new BroadcastChannel('freobus-tab-coordination');
    this.state = {
      isLeader: false,
      lastActive: Date.now(),
      sessionId: Math.random().toString(36).substring(7)
    };

    this.setupChannelListeners();
    this.startHeartbeat();
  }

  private setupChannelListeners(): void {
    this.channel.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'heartbeat':
          this.handleHeartbeat(data);
          break;
        case 'leadership-claim':
          this.handleLeadershipClaim(data);
          break;
        case 'state-update':
          this.handleStateUpdate(data);
          break;
        case 'session-update':
          this.handleSessionUpdate(data);
          break;
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', {
        sessionId: this.state.sessionId,
        timestamp: Date.now()
      });

      if (this.state.isLeader) {
        this.checkLeadership();
      }
    }, 1000);
  }

  private checkLeadership(): void {
    const timeSinceLastActive = Date.now() - this.state.lastActive;
    if (timeSinceLastActive > this.leaderTimeout) {
      this.state.isLeader = false;
      this.emit('leadershipChanged', { newLeader: false });
    }
  }

  private handleHeartbeat(data: any): void {
    if (data.sessionId !== this.state.sessionId) {
      this.state.lastActive = Date.now();
    }
  }

  private handleLeadershipClaim(data: any): void {
    if (!this.state.isLeader) {
      this.state.isLeader = false;
      this.emit('leadershipChanged', { newLeader: data.sessionId });
    }
  }

  private handleStateUpdate(data: any): void {
    this.emit('stateUpdate', data);
  }

  private handleSessionUpdate(data: any): void {
    this.emit('sessionUpdate', data);
  }

  public async requestLock(): Promise<boolean> {
    this.broadcast('leadership-claim', {
      sessionId: this.state.sessionId,
      timestamp: Date.now()
    });

    // Wait for any existing leader to respond
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.state.isLeader) {
      this.state.isLeader = true;
      this.emit('leadershipChanged', { newLeader: this.state.sessionId });
      return true;
    }

    return false;
  }

  public broadcast(type: string, data: any): void {
    this.channel.postMessage({ type, data });
  }

  public getState(): TabState {
    return { ...this.state };
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.channel.close();
  }
} 