import { EventEmitter } from 'events';
import { NetworkState, MEVProtection, GasOptimization, RPCOptimization, Transaction, WalletError } from '../types';
import networks from '../../../shared/networks.json';

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

  private chainConfigs: Map<string, ChainConfig>;
  private networkStates: Map<string, NetworkState>;
  private debounceTimeout: NodeJS.Timeout | null = null;

  constructor(customChainConfigs: Map<string, ChainConfig> = new Map()) {
    super();
    this.chainConfigs = new Map();
    for (const net of networks) {
      this.chainConfigs.set(toHexChainId(net.chainId), {
        chainId: toHexChainId(net.chainId),
        name: net.name,
        rpcUrls: [net.rpcUrl],
        blockExplorerUrl: net.blockExplorerUrl || (net.blockExplorerUrls ? net.blockExplorerUrls[0] : ''),
        nativeCurrency: net.nativeCurrency,
        validationRules: {
          maxGasPrice: 1000,
          minGasLimit: 21000,
          maxGasLimit: 8000000,
          supportedTransactionTypes: ['legacy', 'eip1559'],
          requiredConfirmations: 12
        }
      });
    }
    customChainConfigs.forEach((value, key) => {
      this.chainConfigs.set(key, value);
    });
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