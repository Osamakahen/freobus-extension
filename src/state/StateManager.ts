import { EventEmitter } from 'events';
import { WalletState, Network, Transaction, AccountInfo } from '../types';
import networks from '../../../shared/networks.json';

export class StateManager extends EventEmitter {
  private state: WalletState = {
    isConnected: false,
    accounts: [],
    chainId: networks[0].chainId,
    balance: '0',
    network: {
      ...networks[0],
      symbol: networks[0].currencySymbol,
      explorerUrl: networks[0].blockExplorerUrl
    }
  };

  private static instance: StateManager;

  private constructor() {
    super();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public getState(): WalletState {
    return { ...this.state };
  }

  public async setAccounts(accounts: string[]): Promise<void> {
    this.state.accounts = accounts;
    this.state.isConnected = accounts.length > 0;
    this.emit('accountsChanged', accounts);
    this.emit('stateChanged', this.getState());
  }

  public async setNetwork(network: Network): Promise<void> {
    this.state.network = network;
    this.state.chainId = toHexChainId(network.chainId);
    this.emit('networkChanged', network);
    this.emit('stateChanged', this.getState());
  }

  public async setBalance(balance: string): Promise<void> {
    this.state.balance = balance;
    this.emit('balanceChanged', balance);
    this.emit('stateChanged', this.getState());
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    // In a real implementation, we would store this in persistent storage
    this.emit('transactionAdded', transaction);
  }

  public async getAccountInfo(address: string): Promise<AccountInfo> {
    return {
      address,
      balance: this.state.balance,
      network: this.state.network,
      transactions: [] // In a real implementation, we would fetch this from storage
    };
  }

  public async disconnect(): Promise<void> {
    this.state = {
      ...this.state,
      isConnected: false,
      accounts: [],
      balance: '0'
    };
    this.emit('disconnected');
    this.emit('stateChanged', this.getState());
  }
}

function toHexChainId(chainId: string | number): string {
  if (typeof chainId === "number") return "0x" + chainId.toString(16);
  if (typeof chainId === "string" && chainId.startsWith("0x")) return chainId.toLowerCase();
  return "0x" + parseInt(chainId as string, 10).toString(16);
} 