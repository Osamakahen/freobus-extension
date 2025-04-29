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
  SessionAuth,
  Network
} from './types';

export class Wallet extends EventEmitter {
  private networkStateManager: NetworkStateManager;
  private tabCoordinator: TabCoordinator;
  private connectionRetryManager: ConnectionRetryManager;
  private sessionSecurityManager: SessionSecurityManager;
  private state: WalletState;
  private preferences: WalletPreferences;
  private sessions: Map<string, SessionAuth>;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.networkStateManager = new NetworkStateManager();
    this.tabCoordinator = new TabCoordinator();
    this.connectionRetryManager = new ConnectionRetryManager();
    this.sessionSecurityManager = new SessionSecurityManager();
    this.sessions = new Map();
    this.state = {
      isConnected: false,
      accounts: [],
      chainId: '1',
      balance: '0',
      network: {
        chainId: '1',
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/',
        symbol: 'ETH',
        explorerUrl: 'https://etherscan.io'
      }
    };
    this.preferences = {
      defaultChainId: '1',
      autoConnect: true,
      theme: 'light',
      notifications: true
    };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Network state events
    this.networkStateManager.on('networkSwitched', ({ state }) => {
      const network: Network = {
        chainId: state.chainId,
        name: this.state.network.name,
        rpcUrl: this.state.network.rpcUrl,
        symbol: this.state.network.symbol,
        explorerUrl: this.state.network.explorerUrl
      };
      this.state.network = network;
      this.tabCoordinator.broadcast('network-update', network);
      this.emit('networkChanged', network);
    });

    this.networkStateManager.on('networkStateUpdated', ({ state }) => {
      const network: Network = {
        chainId: state.chainId,
        name: this.state.network.name,
        rpcUrl: this.state.network.rpcUrl,
        symbol: this.state.network.symbol,
        explorerUrl: this.state.network.explorerUrl
      };
      this.state.network = network;
      this.emit('networkStateUpdated', network);
    });

    this.networkStateManager.on('networkSwitchError', ({ error }) => {
      this.emit('error', error);
    });

    // Tab coordination events
    this.tabCoordinator.on('stateUpdate', (state) => {
      this.state = { ...this.state, ...state };
      this.emit('stateUpdate', this.state);
    });

    this.tabCoordinator.on('sessionUpdate', (session) => {
      this.sessions.set(session.origin, session);
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
    this.sessionSecurityManager.on('sessionExpired', (origin) => {
      this.sessions.delete(origin);
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
          const networkState = await this.networkStateManager.initializeNetworkState(this.preferences.defaultChainId);
          return {
            chainId: networkState.chainId,
            name: this.state.network.name,
            rpcUrl: this.state.network.rpcUrl,
            symbol: this.state.network.symbol,
            explorerUrl: this.state.network.explorerUrl
          };
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

      this.sessions.set(origin, session);
      this.tabCoordinator.broadcast('session-update', session);
      return session;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public getPreferences(): WalletPreferences {
    return this.preferences;
  }

  public updatePreferences(preferences: Partial<WalletPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.tabCoordinator.broadcast('state-update', { preferences: this.preferences });
    this.emit('preferencesUpdated', this.preferences);
  }

  public cleanup(): void {
    this.networkStateManager.cleanup();
    this.tabCoordinator.cleanup();
    this.connectionRetryManager.cleanup();
  }
} 