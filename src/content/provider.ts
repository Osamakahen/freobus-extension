import { ethers } from 'ethers';
import { EventEmitter } from 'events';

class FreoBusProvider extends EventEmitter {
  private isInitialized = false;
  private accounts: string[] = [];
  private chainId: string = "0x1";

  constructor() {
    super();
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
      const [accounts, chainId] = await Promise.all([
        this.sendMessage('eth_accounts', {}),
        this.sendMessage('eth_chainId', {})
      ]);
      
      console.log('FreoBusProvider: Initial accounts:', accounts);
      console.log('FreoBusProvider: Initial chainId:', chainId);
      
      this.accounts = accounts || [];
      this.chainId = chainId || "0x1";
      
      // Emit initial events
      if (this.accounts.length > 0) {
        console.log('FreoBusProvider: Emitting initial events');
        this.emit('connect', { chainId: this.chainId });
        this.emit('accountsChanged', this.accounts);
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
          const result = await this.sendMessage(args.method, { params: args.params });
          console.log('FreoBusProvider: Request result:', result);
          return result;
        } catch (error) {
          console.error('FreoBusProvider: Request error:', error);
          throw new Error(`FreoBus: ${error.message}`);
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
        this.on(event, handler);
      },
      removeListener: (event: string, handler: (...args: any[]) => void) => {
        console.log('FreoBusProvider: Removing event listener:', event);
        this.removeListener(event, handler);
      },
      // Add other EIP-1193 required methods
      isConnected: () => {
        console.log('FreoBusProvider: Checking connection status:', this.isInitialized);
        return this.isInitialized;
      },
      chainId: this.chainId,
      selectedAddress: this.accounts[0] || null
    };

    // Inject the provider into the window object
    (window as any).ethereum = provider;
    console.log('FreoBusProvider: Provider injected successfully');
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