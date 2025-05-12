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

function toHexChainId(chainId: string | number): string {
  if (typeof chainId === "number") return "0x" + chainId.toString(16);
  if (typeof chainId === "string" && chainId.startsWith("0x")) return chainId.toLowerCase();
  return "0x" + parseInt(chainId as string, 10).toString(16);
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
    this.chainConfigs = new Map(NetworkStateManager.DEFAULT_CHAIN_CONFIGS);
    customChainConfigs.forEach((value, key) => {
      this.chainConfigs.set(key, value);
    });
    this.networkStates = new Map();
  }

  public async switchNetwork(chainId: string): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    const normalizedChainId = toHexChainId(chainId);
    console.log('[NetworkStateManager] switchNetwork called with:', chainId, 'normalized:', normalizedChainId);
    this.debounceTimeout = setTimeout(async () => {
      try {
        const config = this.chainConfigs.get(normalizedChainId);
        if (!config) {
          const msg = `[NetworkStateManager] Unsupported chain ID: ${normalizedChainId}`;
          console.error(msg);
          this.emit('networkSwitchError', {
            chainId: normalizedChainId,
            error: msg
          });
          throw new WalletError('UNSUPPORTED_CHAIN', msg);
        }

        const state = await this.initializeNetworkState(normalizedChainId);
        this.networkStates.set(normalizedChainId, state);
        
        this.emit('networkSwitched', {
          chainId: normalizedChainId,
          state,
          config
        });
      } catch (error) {
        console.error('[NetworkStateManager] networkSwitchError:', error);
        this.emit('networkSwitchError', {
          chainId: normalizedChainId,
          error
        });
        throw error;
      }
    }, NetworkStateManager.DEBOUNCE_DELAY);
  }

  public async validateTransaction(chainId: string, tx: Transaction): Promise<string[]> {
    const config = this.chainConfigs.get(toHexChainId(chainId));
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
    const normalizedChainId = toHexChainId(chainId);
    return this.networkStates.get(normalizedChainId) || null;
  }

  public async updateNetworkState(chainId: string, state: Partial<NetworkState>): Promise<void> {
    const normalizedChainId = toHexChainId(chainId);
    const currentState = this.networkStates.get(normalizedChainId);
    if (!currentState) {
      const msg = `[NetworkStateManager] No state found for chain ID: ${normalizedChainId}`;
      console.error(msg);
      throw new WalletError('INVALID_CHAIN', msg);
    }
    const newState = { ...currentState, ...state };
    this.networkStates.set(normalizedChainId, newState);
    console.log('[NetworkStateManager] Emitting networkStateUpdated:', normalizedChainId, newState);
    this.emit('networkStateUpdated', { chainId: normalizedChainId, state: newState });
  }

  public async initializeNetworkState(chainId: string): Promise<NetworkState> {
    const normalizedChainId = toHexChainId(chainId);
    const config = this.chainConfigs.get(normalizedChainId);
    if (!config) {
      const msg = `[NetworkStateManager] Invalid chain ID: ${normalizedChainId}`;
      console.error(msg);
      throw new WalletError('INVALID_CHAIN', msg);
    }
    return {
      chainId: normalizedChainId,
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