import { EventEmitter } from 'events';
import { NetworkState, MEVProtection, GasOptimization, RPCOptimization, Transaction, WalletError } from '../types';

interface ChainConfig {
  chainId: string;
  name: string;
  rpcUrls: string[];
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  validationRules: {
    maxGasPrice: number;
    minGasLimit: number;
    maxGasLimit: number;
    supportedTransactionTypes: string[];
    requiredConfirmations: number;
  };
  mevProtection?: MEVProtection;
  gasOptimization?: GasOptimization;
  rpcOptimization?: RPCOptimization;
}

export class NetworkStateManager extends EventEmitter {
  private static readonly DEBOUNCE_DELAY = 500;
  private static readonly DEFAULT_CHAIN_CONFIGS: Map<string, ChainConfig> = new Map([
    ['0x1', {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      validationRules: {
        maxGasPrice: 1000,
        minGasLimit: 21000,
        maxGasLimit: 8000000,
        supportedTransactionTypes: ['legacy', 'eip1559'],
        requiredConfirmations: 12
      },
      mevProtection: {
        maxSlippage: 0.5,
        usePrivatePools: true,
        flashbotProtection: true
      },
      gasOptimization: {
        useEIP1559: true,
        maxPriorityFee: 2,
        baseFeeMultiplier: 1.2
      },
      rpcOptimization: {
        useMultipleProviders: true,
        failoverStrategy: 'latency-based',
        healthCheckInterval: 30000
      }
    }]
  ]);

  private chainConfigs: Map<string, ChainConfig>;
  private networkStates: Map<string, NetworkState>;
  private debounceTimeout: NodeJS.Timeout | null = null;

  constructor(customChainConfigs: Map<string, ChainConfig> = new Map()) {
    super();
    this.chainConfigs = new Map([...NetworkStateManager.DEFAULT_CHAIN_CONFIGS, ...customChainConfigs]);
    this.networkStates = new Map();
  }

  public async switchNetwork(chainId: string): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      try {
        const config = this.chainConfigs.get(chainId);
        if (!config) {
          throw new WalletError('UNSUPPORTED_CHAIN', `Unsupported chain ID: ${chainId}`);
        }

        const state = await this.initializeNetworkState(chainId);
        this.networkStates.set(chainId, state);
        
        this.emit('networkSwitched', {
          chainId,
          state,
          config
        });
      } catch (error) {
        this.emit('networkSwitchError', {
          chainId,
          error
        });
        throw error;
      }
    }, NetworkStateManager.DEBOUNCE_DELAY);
  }

  public async validateTransaction(chainId: string, tx: Transaction): Promise<string[]> {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      return ['Unsupported chain ID'];
    }

    const errors: string[] = [];
    const rules = config.validationRules;

    // Basic validation
    if (tx.gasLimit && Number(tx.gasLimit) < rules.minGasLimit) {
      errors.push(`Gas limit below minimum required (${rules.minGasLimit})`);
    }

    if (tx.gasLimit && Number(tx.gasLimit) > rules.maxGasLimit) {
      errors.push(`Gas limit exceeds maximum allowed (${rules.maxGasLimit})`);
    }

    // MEV Protection
    if (config.mevProtection) {
      if (config.mevProtection.usePrivatePools && !tx.data?.includes('0x')) {
        errors.push('Transaction must use private pools for MEV protection');
      }
    }

    // Gas Optimization
    if (config.gasOptimization?.useEIP1559) {
      if (!tx.maxFeePerGas || !tx.maxPriorityFeePerGas) {
        errors.push('EIP-1559 transaction must include maxFeePerGas and maxPriorityFeePerGas');
      }
    }

    return errors;
  }

  public async getNetworkState(chainId: string): Promise<NetworkState | null> {
    return this.networkStates.get(chainId) || null;
  }

  public async updateNetworkState(chainId: string, state: Partial<NetworkState>): Promise<void> {
    const currentState = this.networkStates.get(chainId);
    if (!currentState) {
      throw new WalletError('INVALID_CHAIN', `No state found for chain ID: ${chainId}`);
    }

    const newState = { ...currentState, ...state };
    this.networkStates.set(chainId, newState);
    this.emit('networkStateUpdated', { chainId, state: newState });
  }

  public async initializeNetworkState(chainId: string): Promise<NetworkState> {
    const config = this.chainConfigs.get(chainId);
    if (!config) {
      throw new WalletError('INVALID_CHAIN', `Invalid chain ID: ${chainId}`);
    }

    // Initialize network state
    return {
      chainId,
      isConnected: true,
      lastBlockNumber: 0,
      gasPrice: 0,
      validationErrors: [],
      mevProtection: config.mevProtection,
      gasOptimization: config.gasOptimization,
      rpcOptimization: config.rpcOptimization
    };
  }

  public cleanup(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.networkStates.clear();
  }
} 