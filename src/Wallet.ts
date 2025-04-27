import { NetworkStateManager } from './network/NetworkStateManager';
import { TabCoordinator } from './utils/TabCoordinator';
import { ConnectionRetryManager } from './utils/ConnectionRetryManager';
import { SessionSecurityManager } from './security/SessionSecurityManager';
import { EventEmitter } from 'events';
import { 
  WalletState, 
  NetworkState, 
  Transaction, 
  WalletError,
  WalletPreferences,
  SessionAuth
} from './types';

export class Wallet extends EventEmitter {
  private networkStateManager: NetworkStateManager;
  private tabCoordinator: TabCoordinator;
  private connectionRetryManager: ConnectionRetryManager;
  private sessionSecurityManager: SessionSecurityManager;
  private state: WalletState;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.networkStateManager = new NetworkStateManager();
    this.tabCoordinator = new TabCoordinator();
    this.connectionRetryManager = new ConnectionRetryManager();
    this.sessionSecurityManager = new SessionSecurityManager();
    this.state = this.initializeState();
    this.setupEventListeners();
  }

  private initializeState(): WalletState {
    return {
      network: {
        chainId: '0x1',
        isConnected: false,
        lastBlockNumber: 0,
        gasPrice: 0,
        validationErrors: []
      },
      sessions: new Map(),
      preferences: {
        defaultChainId: '0x1',
        autoConnect: true,
        theme: 'light',
        notifications: true
      }
    };
  }

  private setupEventListeners(): void {
    // Network state events
    this.networkStateManager.on('networkSwitched', ({ chainId, state }) => {
      this.state.network = state;
      this.tabCoordinator.broadcastNetworkUpdate(state);
      this.emit('networkChanged', state);
    });

    this.networkStateManager.on('networkStateUpdated', ({ chainId, state }) => {
      this.state.network = state;
      this.emit('networkStateUpdated', state);
    });

    this.networkStateManager.on('networkSwitchError', ({ chainId, error }) => {
      this.emit('error', error);
    });

    // Tab coordination events
    this.tabCoordinator.on('stateUpdate', (state) => {
      this.state = { ...this.state, ...state };
      this.emit('stateUpdate', this.state);
    });

    this.tabCoordinator.on('sessionUpdate', (session) => {
      this.state.sessions.set(session.origin, session);
      this.emit('sessionUpdate', session);
    });

    this.tabCoordinator.on('networkUpdate', (network) => {
      this.networkStateManager.updateNetworkState(network.chainId, network);
    });

    this.tabCoordinator.on('lockAcquired', () => {
      this.emit('lockAcquired');
    });

    this.tabCoordinator.on('lockReleased', () => {
      this.emit('lockReleased');
    });

    this.tabCoordinator.on('leadershipChanged', ({ newLeader }) => {
      this.emit('leadershipChanged', { newLeader });
    });

    // Connection retry events
    this.connectionRetryManager.on('retryScheduled', ({ origin, attempt, delay }) => {
      this.emit('connectionRetryScheduled', { origin, attempt, delay });
    });

    this.connectionRetryManager.on('maxRetriesExceeded', ({ origin, attempt }) => {
      this.emit('maxRetriesExceeded', { origin, attempt });
    });

    // Session security events
    this.sessionSecurityManager.on('sessionAuthenticated', (session) => {
      this.state.sessions.set(session.origin, session);
      this.emit('sessionAuthenticated', session);
    });

    this.sessionSecurityManager.on('sessionExpired', (origin) => {
      this.state.sessions.delete(origin);
      this.emit('sessionExpired', origin);
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request tab lock with retry
      await this.connectionRetryManager.retryConnection(
        'tab-lock',
        async () => {
          const success = await this.tabCoordinator.requestLock();
          if (!success) {
            throw new WalletError('TAB_LOCK_FAILED', 'Failed to acquire tab lock');
          }
          return success;
        }
      );

      // Initialize network state with retry
      const defaultNetwork = await this.connectionRetryManager.retryConnection(
        'network-init',
        async () => {
          return this.networkStateManager.initializeNetworkState(this.state.preferences.defaultChainId);
        }
      );

      this.state.network = defaultNetwork;
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async switchNetwork(chainId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new WalletError('NOT_INITIALIZED', 'Wallet not initialized');
    }

    try {
      await this.connectionRetryManager.retryConnection(
        'network-switch',
        async () => {
          await this.networkStateManager.switchNetwork(chainId);
        }
      );
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async validateTransaction(transaction: Transaction): Promise<void> {
    if (!this.isInitialized) {
      throw new WalletError('NOT_INITIALIZED', 'Wallet not initialized');
    }

    try {
      const errors = await this.networkStateManager.validateTransaction(transaction.chainId, transaction);
      if (errors.length > 0) {
        throw new WalletError('VALIDATION_ERROR', 'Transaction validation failed', { errors });
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async authenticateSession(origin: string, address: string): Promise<SessionAuth> {
    if (!this.isInitialized) {
      throw new WalletError('NOT_INITIALIZED', 'Wallet not initialized');
    }

    try {
      const session = await this.connectionRetryManager.retryConnection(
        'session-auth',
        async () => {
          return this.sessionSecurityManager.authenticateSession(origin, address);
        }
      );

      this.state.sessions.set(origin, session);
      this.tabCoordinator.broadcastSessionUpdate(session);
      return session;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public getNetworkState(): NetworkState {
    return this.state.network;
  }

  public getPreferences(): WalletPreferences {
    return this.state.preferences;
  }

  public updatePreferences(preferences: Partial<WalletPreferences>): void {
    this.state.preferences = { ...this.state.preferences, ...preferences };
    this.tabCoordinator.broadcastStateUpdate({ preferences: this.state.preferences });
    this.emit('preferencesUpdated', this.state.preferences);
  }

  public cleanup(): void {
    this.networkStateManager.cleanup();
    this.tabCoordinator.cleanup();
    this.connectionRetryManager.cleanup();
    this.sessionSecurityManager.cleanup();
    this.isInitialized = false;
  }
} 