/// <reference types="chrome"/>
import { ethers } from 'ethers';
import type { Account, Network } from '../shared/types/wallet';
import { networks } from '../shared/networks';

// --- Browser-safe base64 helpers ---
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Crypto helpers ---
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
async function encryptMnemonic(mnemonic: string, password: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(mnemonic)
  );
  return {
    encrypted: uint8ToBase64(new Uint8Array(encrypted)),
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv)
  };
}
async function decryptMnemonic(encrypted: string, password: string, salt: string, iv: string): Promise<string> {
  const dec = new TextDecoder();
  const key = await deriveKey(password, base64ToUint8(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToUint8(iv) },
    key,
    base64ToUint8(encrypted)
  );
  return dec.decode(decrypted);
}

console.log('[Background] Service worker loaded');
console.log('[Background] Ethers version:', ethers.version);

let walletState: {
  exists: boolean;
  isUnlocked: boolean;
  selectedAccount: Account | null;
  selectedNetwork: Network | null;
  networks: Network[];
} = {
  exists: false,
  isUnlocked: false,
  selectedAccount: null,
  selectedNetwork: null,
  networks: [],
};

// Load wallet state from storage on startup
chrome.storage.local.get('walletState', (result) => {
  if (result.walletState) {
    walletState = result.walletState;
    console.log('[Background] Loaded walletState from storage:', walletState);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message:', message);

  if (message.type === 'testMessage') {
    sendResponse({ success: true, reply: 'Hello from background!' });
    return true;
  }

  if (message.type === 'getWalletState') {
    chrome.storage.local.get('walletState', (result) => {
      console.log('[Background] getWalletState:', result.walletState);
      sendResponse(result.walletState || walletState);
    });
    return true;
  }

  if (message.type === 'disconnectWallet') {
    walletState.isUnlocked = false;
    walletState.selectedAccount = null;
    walletState.selectedNetwork = null;
    chrome.storage.local.set({ walletState });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'generate_mnemonic') {
    try {
      const wallet = ethers.Wallet.createRandom();
      const mnemonic = wallet.mnemonic.phrase;
      sendResponse({ success: true, mnemonic });
    } catch (error) {
      sendResponse({ success: false, error: 'Failed to generate mnemonic' });
    }
    return true;
  }

  if (message.action === 'create_wallet') {
    let responded = false;
    (async () => {
      try {
        const { mnemonic, password } = message;
        if (!mnemonic || !password) {
          sendResponse({ success: false, error: 'Mnemonic and password are required' });
          responded = true;
          return;
        }
        const { encrypted, salt, iv } = await encryptMnemonic(mnemonic, password);
        chrome.storage.local.set({ vault: { encrypted, salt, iv } }, () => {
          let wallet: import('ethers').Wallet;
          try {
            wallet = ethers.Wallet.fromMnemonic(mnemonic);
          } catch (err: any) {
            sendResponse({ success: false, error: 'Invalid seed phrase. Please check and try again.' });
            responded = true;
            return;
          }
          walletState.exists = true;
          walletState.isUnlocked = true;
          walletState.selectedAccount = {
            address: wallet.address,
            name: 'Account 1',
            index: 0,
            balances: {},
            privateKey: wallet.privateKey
          };
          walletState.selectedNetwork = {
            name: 'Ethereum',
            chainId: '1',
            rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
            blockExplorerUrl: 'https://etherscan.io',
            currencySymbol: 'ETH',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
          };
          walletState.networks = [walletState.selectedNetwork];
          chrome.storage.local.set({ walletState }, () => {
            sendResponse({
              success: true,
              walletState,
              address: wallet.address
            });
          });
          responded = true;
        });
      } catch (error) {
        if (!responded) sendResponse({ success: false, error: 'Failed to create wallet' });
      }
    })().catch((err) => {
      if (!responded) sendResponse({ success: false, error: err?.message || 'Failed to create wallet' });
    });
    return true;
  }

  if (message.action === 'unlock_wallet') {
    chrome.storage.local.get('vault', async (result) => {
      if (!result.vault) {
        sendResponse({ success: false, error: 'No vault found' });
        return;
      }
      const { encrypted, salt, iv } = result.vault;
      try {
        const mnemonic = await decryptMnemonic(encrypted, message.password, salt, iv);
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        walletState.exists = true;
        walletState.isUnlocked = true;
        walletState.selectedAccount = {
          address: wallet.address,
          name: 'Account 1',
          index: 0,
          balances: {},
          privateKey: wallet.privateKey
        };
        walletState.selectedNetwork = {
          name: 'Ethereum',
          chainId: '1',
          rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
          blockExplorerUrl: 'https://etherscan.io',
          currencySymbol: 'ETH',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        };
        walletState.networks = [walletState.selectedNetwork];
        chrome.storage.local.set({ walletState }, () => {
          sendResponse({ success: true, walletState });
        });
      } catch (e) {
        sendResponse({ success: false, error: 'Incorrect password' });
      }
    });
    return true;
  }

  if (message.action === 'get_transaction_history') {
    const { address } = message;
    
    // Get transactions from the last 100 blocks
    chrome.storage.local.get(['transactions'], async (result) => {
      const storedTransactions = result.transactions || {};
      const userTransactions = storedTransactions[address] || [];
      
      // Sort by timestamp descending
      const sortedTransactions = userTransactions.sort((a: any, b: any) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      );
      
      sendResponse({
        success: true,
        transactions: sortedTransactions
      });
    });
    
    return true; // Keep the message channel open for async response
  }

  if (message.action === 'switch_network') {
    const { network } = message;
    
    // Validate the network
    const isValidNetwork = networks.some(n => n.chainId === network.chainId);
    if (!isValidNetwork) {
      sendResponse({ success: false, error: 'Invalid network' });
      return true;
    }

    // Update wallet state
    walletState.selectedNetwork = network;
    chrome.storage.local.set({ walletState }, () => {
      sendResponse({ success: true, walletState });
    });

    return true;
  }

  console.log('[Background] Unhandled message:', message);
});

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === "install") {
    console.log("FreoBus Extension installed");
  }
}); 