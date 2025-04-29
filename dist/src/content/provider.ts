import { ethers } from 'ethers';

class FreoBusProvider {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if we have permission to interact with this website
      const hasPermission = await this.sendMessage('checkPermission', { method: 'web3' });
      if (!hasPermission) {
        console.warn('FreoBus: No permission to interact with this website');
        return;
      }

      this.isInitialized = true;
      this.injectProvider();
    } catch (error) {
      console.error('FreoBus: Failed to initialize provider', error);
    }
  }

  private injectProvider() {
    // Create a new ethers provider
    const provider = new ethers.providers.Web3Provider({
      send: async (request, callback) => {
        try {
          const response = await this.sendMessage('retrieveData', { key: request.method });
          callback(null, response);
        } catch (error) {
          callback(error, null);
        }
      }
    });

    // Inject the provider into the window object
    (window as any).ethereum = provider;
    console.log('FreoBus: Web3 provider injected');
  }

  private async sendMessage(type: string, data: any) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (!response.success) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.value);
      });
    });
  }
}

// Export the initialization function
export function initializeProvider() {
  new FreoBusProvider();
} 