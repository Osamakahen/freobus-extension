import { SecurityManager } from './src/security/SecurityManager';
import { StateManager } from './src/state/StateManager';
import { 
  Message, 
  Response, 
  Network, 
  MessageData, 
  Transaction,
  InitializeData,
  StoreDataData,
  RetrieveDataData,
  CheckPermissionData,
  GrantPermissionData,
  SignTransactionData,
  SignMessageData,
  SwitchNetworkData,
  GetBalanceData,
  Permission
} from './src/types';

let securityManager: SecurityManager | null = null;
let stateManager: StateManager | null = null;

async function handleInitialize(data: InitializeData): Promise<Response> {
  try {
    securityManager = new SecurityManager();
    await securityManager.initialize(data.password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleStoreData(data: StoreDataData): Promise<Response> {
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

async function handleRetrieveData(data: RetrieveDataData): Promise<Response> {
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

async function handleCheckPermission(data: CheckPermissionData): Promise<Response> {
  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  const hasPermission = securityManager.hasPermission(data.origin, data.method);
  return { success: true, value: hasPermission };
}

async function handleGrantPermission(data: GrantPermissionData): Promise<Response> {
  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  securityManager.grantPermission(data.origin, data.methods, data.expiresIn);
  return { success: true };
}

async function handleSignTransaction(data: SignTransactionData): Promise<Response> {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    // In a real implementation, we would sign the transaction using the private key
    // For now, we'll just store it and return a mock signature
    if (!stateManager) {
      return { success: false, error: 'State manager not initialized' };
    }
    await stateManager.addTransaction(data.transaction);
    return { success: true, value: '0x' + '0'.repeat(130) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleSignMessage(data: SignMessageData): Promise<Response> {
  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    // In a real implementation, we would sign the message using the private key
    // For now, we'll just return a mock signature
    return { success: true, value: '0x' + '0'.repeat(130) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleSwitchNetwork(data: SwitchNetworkData): Promise<Response> {
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

async function handleGetBalance(data: GetBalanceData): Promise<Response> {
  if (!stateManager) {
    return { success: false, error: 'State manager not initialized' };
  }
  try {
    // In a real implementation, we would fetch the balance from the network
    const balance = '0';
    await stateManager.setBalance(balance);
    return { success: true, value: balance };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function getNetworkByChainId(chainId: string): Promise<Network> {
  // In a real implementation, we would have a list of supported networks
  const networks: Record<string, Network> = {
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

self.addEventListener('message', async (event: MessageEvent<Message>) => {
  const { type, data } = event.data;
  let response: Response;

  try {
    switch (type) {
      case 'initialize':
        response = await handleInitialize(data as InitializeData);
        break;
      case 'storeData':
        response = await handleStoreData(data as StoreDataData);
        break;
      case 'retrieveData':
        response = await handleRetrieveData(data as RetrieveDataData);
        break;
      case 'checkPermission':
        response = await handleCheckPermission(data as CheckPermissionData);
        break;
      case 'grantPermission':
        response = await handleGrantPermission(data as GrantPermissionData);
        break;
      case 'signTransaction':
        response = await handleSignTransaction(data as SignTransactionData);
        break;
      case 'signMessage':
        response = await handleSignMessage(data as SignMessageData);
        break;
      case 'switchNetwork':
        response = await handleSwitchNetwork(data as SwitchNetworkData);
        break;
      case 'getBalance':
        response = await handleGetBalance(data as GetBalanceData);
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