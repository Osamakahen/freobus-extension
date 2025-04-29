import { SecurityManager } from './src/security/SecurityManager.js';
import { StateManager } from './src/state/StateManager.js';
import { Message, Response } from './src/types/index.js';

const securityManager = new SecurityManager();
const stateManager = StateManager.getInstance();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return; // Only accept messages from tabs

  const { type, data } = message;

  switch (type) {
    case 'initialize':
      handleInitialize(data.password, sendResponse);
      return true;

    case 'storeData':
      handleStoreData(data, sendResponse);
      return true;

    case 'retrieveData':
      handleRetrieveData(data, sendResponse);
      return true;

    case 'checkPermission':
      handleCheckPermission(sender.origin, data.method, sendResponse);
      return false;

    case 'grantPermission':
      handleGrantPermission(sender.origin, data.methods, data.expiresIn, sendResponse);
      return false;

    case 'revokePermission':
      handleRevokePermission(sender.origin, sendResponse);
      return false;

    case 'signTransaction':
      handleSignTransaction(data.transaction, sendResponse);
      return true;

    case 'signMessage':
      handleSignMessage(data.message, data.address, sendResponse);
      return true;

    case 'switchNetwork':
      handleSwitchNetwork(data.chainId, sendResponse);
      return true;

    case 'getAccounts':
      handleGetAccounts(sendResponse);
      return false;

    case 'getBalance':
      handleGetBalance(data.address, sendResponse);
      return true;

    case 'getNetwork':
      handleGetNetwork(sendResponse);
      return false;
  }
});

async function handleInitialize(password, sendResponse) {
  try {
    await securityManager.initialize(password);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStoreData(data, sendResponse) {
  if (!securityManager.isReady()) {
    sendResponse({ success: false, error: 'Security manager not initialized' });
    return;
  }
  try {
    await securityManager.storeData(data.key, data.value);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRetrieveData(data, sendResponse) {
  if (!securityManager.isReady()) {
    sendResponse({ success: false, error: 'Security manager not initialized' });
    return;
  }
  try {
    const value = await securityManager.retrieveData(data.key);
    sendResponse({ success: true, value });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleCheckPermission(origin, method, sendResponse) {
  const hasPermission = securityManager.hasPermission(origin, method);
  sendResponse({ success: true, value: hasPermission });
}

function handleGrantPermission(origin, methods, expiresIn, sendResponse) {
  securityManager.grantPermission(origin, methods, expiresIn);
  sendResponse({ success: true });
}

function handleRevokePermission(origin, sendResponse) {
  securityManager.revokePermission(origin);
  sendResponse({ success: true });
}

async function handleSignTransaction(transaction, sendResponse) {
  if (!securityManager.isReady()) {
    sendResponse({ success: false, error: 'Security manager not initialized' });
    return;
  }
  try {
    // In a real implementation, we would sign the transaction using the private key
    // For now, we'll just store it and return a mock signature
    await stateManager.addTransaction(transaction);
    sendResponse({ success: true, value: '0x' + '0'.repeat(130) });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSignMessage(message, address, sendResponse) {
  if (!securityManager.isReady()) {
    sendResponse({ success: false, error: 'Security manager not initialized' });
    return;
  }
  try {
    // In a real implementation, we would sign the message using the private key
    // For now, we'll just return a mock signature
    sendResponse({ success: true, value: '0x' + '0'.repeat(130) });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSwitchNetwork(chainId, sendResponse) {
  try {
    const network = await getNetworkByChainId(chainId);
    await stateManager.setNetwork(network);
    sendResponse({ success: true, value: network });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleGetAccounts(sendResponse) {
  const state = stateManager.getState();
  sendResponse({ success: true, value: state.accounts });
}

async function handleGetBalance(address, sendResponse) {
  try {
    // In a real implementation, we would fetch the balance from the network
    const balance = '0';
    await stateManager.setBalance(balance);
    sendResponse({ success: true, value: balance });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleGetNetwork(sendResponse) {
  const state = stateManager.getState();
  sendResponse({ success: true, value: state.network });
}

async function getNetworkByChainId(chainId) {
  // In a real implementation, we would have a list of supported networks
  const networks = {
    '0x1': {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/',
      symbol: 'ETH',
      explorerUrl: 'https://etherscan.io'
    },
    '0x5': {
      chainId: '0x5',
      name: 'Goerli Testnet',
      rpcUrl: 'https://goerli.infura.io/v3/',
      symbol: 'ETH',
      explorerUrl: 'https://goerli.etherscan.io'
    }
  };
  return networks[chainId] || networks['0x1'];
} 