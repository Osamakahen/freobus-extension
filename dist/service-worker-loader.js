import './assets/index.ts2.js';
import { SecurityManager } from './src/security/SecurityManager.js';
import { StateManager } from './src/state/StateManager.js';

let securityManager = null;
let stateManager = null;

async function handleInitialize(data) {
  try {
    securityManager = new SecurityManager();
    await securityManager.initialize(data.password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleStoreData(data) {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    await securityManager.storeData(data.key, data.value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleRetrieveData(data) {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    const value = await securityManager.retrieveData(data.key);
    return { success: true, value };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleCheckPermission(data) {
  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  const hasPermission = securityManager.hasPermission(data.origin, data.method);
  return { success: true, value: hasPermission };
}

async function handleGrantPermission(data) {
  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  securityManager.grantPermission(data.origin, data.methods, data.expiresIn);
  return { success: true };
}

async function handleSignTransaction(data) {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    if (!stateManager) {
      return { success: false, error: 'State manager not initialized' };
    }
    await stateManager.addTransaction(data.transaction);
    return { success: true, value: '0x' + '0'.repeat(130) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleSignMessage(data) {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    return { success: true, value: '0x' + '0'.repeat(130) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleSwitchNetwork(data) {
  if (!stateManager) {
    return { success: false, error: 'State manager not initialized' };
  }
  try {
    const network = await getNetworkByChainId(data.chainId);
    await stateManager.setNetwork(network);
    return { success: true, value: network };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleGetBalance(data) {
  if (!stateManager) {
    return { success: false, error: 'State manager not initialized' };
  }
  try {
    const balance = '0';
    await stateManager.setBalance(balance);
    return { success: true, value: balance };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function getNetworkByChainId(chainId) {
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

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  let response;

  try {
    switch (type) {
      case 'initialize':
        response = await handleInitialize(data);
        break;
      case 'storeData':
        response = await handleStoreData(data);
        break;
      case 'retrieveData':
        response = await handleRetrieveData(data);
        break;
      case 'checkPermission':
        response = await handleCheckPermission(data);
        break;
      case 'grantPermission':
        response = await handleGrantPermission(data);
        break;
      case 'signTransaction':
        response = await handleSignTransaction(data);
        break;
      case 'signMessage':
        response = await handleSignMessage(data);
        break;
      case 'switchNetwork':
        response = await handleSwitchNetwork(data);
        break;
      case 'getBalance':
        response = await handleGetBalance(data);
        break;
      default:
        response = { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    response = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }

  if (event.source) {
    event.source.postMessage(response);
  }
});
