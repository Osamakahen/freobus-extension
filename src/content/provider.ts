import { EventEmitter } from 'events';
import { ethers } from 'ethers';

interface ProviderAccounts {
  accounts?: string[];
}

interface ProviderChainId {
  chainId?: string;
}

class FreoBusProvider extends EventEmitter {
  private isInitialized = false;
  private accounts: string[] = [];
  private chainId: string = "0xaa36a7";
  private rpcUrl: string = "https://sepolia.infura.io/v3/6131105f1e4c4841a297c5392effa977";
  private _eventEmitter: EventEmitter;
  private ethersProvider: ethers.providers.JsonRpcProvider;

  constructor() {
    super();
    this._eventEmitter = new EventEmitter();
    this.ethersProvider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    console.log('FreoBusProvider: Initializing...');
    this.initialize();
  }

  private async initialize() {
    try {
      console.log('FreoBusProvider: Starting initialization...');
      // Inject provider immediately to ensure it's available for dApps
      this.injectProvider();
      
      // Check permissions in the background
      const hasPermission = await this.sendMessage('checkPermission', { method: 'web3' });
      console.log('FreoBusProvider: Permission check result:', hasPermission);
      
      if (!hasPermission) {
        console.warn('FreoBus: No permission to interact with this website');
        return;
      }

      this.isInitialized = true;
      
      // Initialize accounts and chainId
      const [accountsResponse, chainIdResponse] = await Promise.all([
        this.sendMessage('eth_accounts', {}) as Promise<ProviderAccounts>,
        this.sendMessage('eth_chainId', {}) as Promise<ProviderChainId>
      ]);
      
      console.log('FreoBusProvider: Initial accounts:', accountsResponse);
      console.log('FreoBusProvider: Initial chainId:', chainIdResponse);
      
      this.accounts = accountsResponse?.accounts || [];
      this.chainId = chainIdResponse?.chainId || "0x1";
      
      // Emit initial events
      if (this.accounts.length > 0) {
        console.log('FreoBusProvider: Emitting initial events');
        this._eventEmitter.emit('connect', { chainId: this.chainId });
        this._eventEmitter.emit('accountsChanged', this.accounts);
      }
      
      console.log('FreoBusProvider: Initialization complete');
    } catch (error) {
      console.error('FreoBus: Failed to initialize provider', error);
    }
  }

  private injectProvider() {
    console.log('FreoBusProvider: Injecting provider...');
    // Create a new provider that implements EIP-1193
    const provider = {
      isFreoWallet: true,
      request: async (args: { method: string; params?: any[] }) => {
        console.log('FreoBusProvider: Handling request:', args.method);
        try {
          switch (args.method) {
            case 'eth_chainId':
              return this.chainId;
            case 'eth_accounts':
              return this.accounts;
            case 'eth_blockNumber':
              return (await this.ethersProvider.getBlockNumber()).toString();
            case 'eth_getBalance': {
              const [address, blockTag] = args.params || [];
              return (await this.ethersProvider.getBalance(address, blockTag)).toHexString();
            }
            // Add more methods as needed
            default:
              // Fallback to extension messaging for unhandled methods
              const result = await this.sendMessage(args.method, { params: args.params });
              console.log('FreoBusProvider: Request result:', result);
              return result;
          }
        } catch (error) {
          console.error('FreoBusProvider: Request error:', error);
          if (error instanceof Error) {
            throw new Error(`FreoBus: ${error.message}`);
          }
          throw new Error('FreoBus: Unknown error');
        }
      },
      send: async (request: { method: string; params?: any[] }, callback: (error: any, result: any) => void) => {
        console.log('FreoBusProvider: Handling send:', request.method);
        try {
          const result = await this.sendMessage(request.method, { params: request.params });
          console.log('FreoBusProvider: Send result:', result);
          callback(null, result);
        } catch (error) {
          console.error('FreoBusProvider: Send error:', error);
          callback(error, null);
        }
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        console.log('FreoBusProvider: Adding event listener:', event);
        this._eventEmitter.on(event, handler);
      },
      removeListener: (event: string, handler: (...args: any[]) => void) => {
        console.log('FreoBusProvider: Removing event listener:', event);
        this._eventEmitter.removeListener(event, handler);
      },
      // Add other EIP-1193 required methods
      isConnected: () => {
        console.log('FreoBusProvider: Checking connection status:', this.isInitialized);
        return this.isInitialized;
      },
      chainId: this.chainId,
      selectedAddress: this.accounts[0] || null,
      _eventEmitter: this._eventEmitter // Expose for testing
    };

    // Inject the provider into the window object
    (window as any).ethereum = provider;
    (window as any).FreoBus = provider;
    console.log('FreoBusProvider: Provider injected successfully as window.ethereum and window.FreoBus');
  }

  private async sendMessage(type: string, data: any) {
    console.log('FreoBusProvider: Sending message:', type, data);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('FreoBusProvider: Runtime error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        if (!response.success) {
          console.error('FreoBusProvider: Response error:', response.error);
          reject(new Error(response.error));
          return;
        }
        console.log('FreoBusProvider: Message response:', response.value);
        resolve(response.value);
      });
    });
  }
}

// Export the initialization function
export function initializeProvider() {
  console.log('FreoBusProvider: Starting provider initialization...');
  new FreoBusProvider();
} 