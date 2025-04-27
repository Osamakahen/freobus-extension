// Error Types
export class WalletError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

// MEV Protection
export interface MEVProtection {
  maxSlippage: number;
  usePrivatePools: boolean;
  flashbotProtection: boolean;
}

// Gas Optimization
export interface GasOptimization {
  useEIP1559: boolean;
  maxPriorityFee: number;
  baseFeeMultiplier: number;
}

// RPC Optimization
export interface RPCOptimization {
  useMultipleProviders: boolean;
  failoverStrategy: 'round-robin' | 'latency-based';
  healthCheckInterval: number;
}

// Network State
export interface NetworkState {
  chainId: string;
  isConnected: boolean;
  lastBlockNumber: number;
  gasPrice: number;
  validationErrors: string[];
  mevProtection?: MEVProtection;
  gasOptimization?: GasOptimization;
  rpcOptimization?: RPCOptimization;
}

// Wallet State
export interface WalletState {
  network: NetworkState;
  sessions: Map<string, SessionAuth>;
  preferences: WalletPreferences;
}

// Wallet Preferences
export interface WalletPreferences {
  defaultChainId: string;
  autoConnect: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
}

// Session Auth
export interface SessionAuth {
  origin: string;
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

// Transaction
export interface Transaction {
  chainId: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  type?: number;
}

// State Update
export interface StateUpdate {
  type: 'NETWORK' | 'SESSION' | 'PREFERENCES';
  payload: any;
  timestamp: number;
} 