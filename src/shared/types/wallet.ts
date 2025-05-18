import { BigNumber } from 'ethers';

export interface Account {
  address: string
  name?: string
  index: number
  balances: { [chainId: string]: string }
  privateKey?: string // For development/testing only
}

export interface Network {
  chainId: string
  name: string
  rpcUrl: string
  currencySymbol: string
  blockExplorerUrl?: string
  icon?: string // Optional icon URL for the network
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorerUrls?: string[]
}

export interface WalletState {
  isUnlocked: boolean
  selectedAccount?: Account
  accounts: Account[]
  selectedNetwork: Network
  networks: Network[]
  connectedSites: {
    [origin: string]: {
      chainId: string
      accounts: string[]
      lastConnected: number
      autoConnect: boolean
      permissions: {
        eth_accounts: boolean
        eth_chainId: boolean
        personal_sign: boolean
        eth_sendTransaction: boolean
        wallet_switchEthereumChain: boolean
      }
    }
  }
}

// NOTE: Use string for value/gas fields in popup/shared types to avoid ethers.js in popup bundle.
// The background script can convert to BigNumber as needed.
export interface Transaction {
  hash?: string;
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
  status?: 'pending' | 'confirmed' | 'failed';
  timestamp?: number;
  blockNumber?: number;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp?: number;
  from?: string;
}

export interface SignatureRequest {
  id: string
  type: "transaction" | "message" | "typedData"
  origin: string
  account: string
  data: Transaction | string | any // 'any' for EIP-712 typed data
  created: number
}

export interface StoredVault {
  encryptedSeed: string
  salt: string
  iv: string
  version: number
} 