import { BigNumber } from "ethers";

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
  isConnected: boolean;
  accounts: string[];
  chainId: string;
  balance: string;
  network: Network;
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
  from: string;
  to: string;
  value: BigNumber;
  data?: string;
  nonce?: number;
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
  chainId: string;
}

// State Update
export interface StateUpdate {
  type: 'NETWORK' | 'SESSION' | 'PREFERENCES';
  payload: any;
  timestamp: number;
}

// Wallet Message
export interface WalletMessage {
  name: string;
  body: {
    type: "CREATE_WALLET" | "UNLOCK_WALLET" | "ADD_ACCOUNT" | "SIGN_TRANSACTION" | 
          "CONNECT_SITE" | "DISCONNECT_SITE" | "SET_NETWORK" | "GET_SESSION" | 
          "SIGN_MESSAGE" | "SWITCH_CHAIN";
    payload?: any;
  };
}

export interface Network {
  chainId: string;
  name: string;
  rpcUrl: string;
  symbol: string;
  explorerUrl: string;
}

export interface Message {
  type: MessageType;
  data: MessageData;
}

export type MessageType = 
  | 'initialize'
  | 'storeData'
  | 'retrieveData'
  | 'checkPermission'
  | 'grantPermission'
  | 'revokePermission'
  | 'signTransaction'
  | 'signMessage'
  | 'switchNetwork'
  | 'getAccounts'
  | 'getBalance'
  | 'getNetwork';

export type MessageData = 
  | InitializeData
  | StoreDataData
  | RetrieveDataData
  | CheckPermissionData
  | GrantPermissionData
  | RevokePermissionData
  | SignTransactionData
  | SignMessageData
  | SwitchNetworkData
  | GetBalanceData
  | EmptyData;

export interface InitializeData {
  password: string;
}

export interface StoreDataData {
  key: string;
  value: any;
}

export interface RetrieveDataData {
  key: string;
}

export interface CheckPermissionData {
  origin: string;
  method: string;
}

export interface GrantPermissionData {
  origin: string;
  methods: string[];
  expiresIn?: number;
}

export interface RevokePermissionData {
  // No required fields
}

export interface SignTransactionData {
  transaction: Transaction;
  origin: string;
}

export interface SignMessageData {
  message: string;
  address: string;
}

export interface SwitchNetworkData {
  chainId: string;
}

export interface GetBalanceData {
  address: string;
}

export interface EmptyData {
  // No required fields
}

export interface Response {
  success: boolean;
  error?: string;
  value?: any;
}

export interface Permission {
  origin: string;
  methods: string[];
  expiresAt?: number;
}

export interface AccountInfo {
  address: string;
  balance: string;
  network: Network;
  transactions: Transaction[];
} 