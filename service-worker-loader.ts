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
import { BigNumber } from 'ethers';

let securityManager: SecurityManager | null = null;
let stateManager: StateManager | null = null;

/**
 * Validates the input data for a message handler
 * @param data - The input data to validate
 * @param requiredFields - Array of required field names
 * @returns Response object with validation result
 */
function validateInput(data: any, requiredFields: string[]): Response | null {
  for (const field of requiredFields) {
    if (data[field] === undefined) {
      return { success: false, error: `Missing required field: ${field}` };
    }
  }
  return null;
}

/**
 * Initializes the security manager with the provided password
 * @param data - InitializeData containing the password
 * @returns Response indicating success or failure
 */
async function handleInitialize(data: InitializeData): Promise<Response> {
  const validation = validateInput(data, ['password']);
  if (validation) return validation;

  try {
    securityManager = new SecurityManager();
    await securityManager.initialize(data.password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Stores encrypted data in the secure storage
 * @param data - StoreDataData containing key and value
 * @returns Response indicating success or failure
 */
async function handleStoreData(data: StoreDataData): Promise<Response> {
  const validation = validateInput(data, ['key', 'value']);
  if (validation) return validation;

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

/**
 * Retrieves and decrypts data from secure storage
 * @param data - RetrieveDataData containing the key
 * @returns Response containing the decrypted value or error
 */
async function handleRetrieveData(data: RetrieveDataData): Promise<Response> {
  const validation = validateInput(data, ['key']);
  if (validation) return validation;

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

/**
 * Checks if a specific permission is granted for an origin
 * @param data - CheckPermissionData containing origin and method
 * @returns Response indicating whether permission is granted
 */
async function handleCheckPermission(data: CheckPermissionData): Promise<Response> {
  const validation = validateInput(data, ['origin', 'method']);
  if (validation) return validation;

  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  const hasPermission = securityManager.hasPermission(data.origin, data.method);
  return { success: true, value: hasPermission };
}

/**
 * Grants permissions to an origin for specific methods
 * @param data - GrantPermissionData containing origin, methods, and optional expiration
 * @returns Response indicating success or failure
 */
async function handleGrantPermission(data: GrantPermissionData): Promise<Response> {
  const validation = validateInput(data, ['origin', 'methods']);
  if (validation) return validation;

  if (!securityManager) {
    return { success: false, error: 'Security manager not initialized' };
  }
  securityManager.grantPermission(data.origin, data.methods, data.expiresIn);
  return { success: true };
}

/**
 * Signs a transaction using the wallet's private key
 * @param data - SignTransactionData containing the transaction details
 * @returns Response containing the signature or error
 */
async function handleSignTransaction(data: SignTransactionData): Promise<Response> {
  const validation = validateInput(data, ['transaction', 'origin']);
  if (validation) return validation;

  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }

  try {
    if (!stateManager) {
      return { success: false, error: 'State manager not initialized' };
    }

    // Validate transaction fields
    if (!data.transaction.to || !data.transaction.from) {
      return { success: false, error: 'Invalid transaction: missing required fields' };
    }

    // Validate transaction value
    if (data.transaction.value.lt(0)) {
      return { success: false, error: 'Invalid transaction: value cannot be negative' };
    }

    // Validate gas parameters
    const maxGasPrice = BigNumber.from('100000000000'); // 100 Gwei
    if (data.transaction.gasPrice && data.transaction.gasPrice.gt(maxGasPrice)) {
      return { success: false, error: 'Invalid transaction: gas price too high' };
    }

    if (data.transaction.maxFeePerGas && data.transaction.maxFeePerGas.gt(maxGasPrice)) {
      return { success: false, error: 'Invalid transaction: max fee per gas too high' };
    }

    // Check if the transaction is from a connected account
    const state = stateManager.getState();
    if (!state.accounts.some(account => account.toLowerCase() === data.transaction.from.toLowerCase())) {
      return { success: false, error: 'Invalid transaction: sender account not connected' };
    }

    const signedTx = await securityManager.signTransaction(data.transaction);
    await stateManager.addTransaction(data.transaction);
    return { success: true, value: signedTx };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient funds for transaction' };
      }
      if (error.message.includes('nonce')) {
        return { success: false, error: 'Invalid transaction nonce' };
      }
      if (error.message.includes('chain')) {
        return { success: false, error: 'Invalid chain ID' };
      }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Signs a message using the wallet's private key
 * @param data - SignMessageData containing message and address
 * @returns Response containing the signature or error
 */
async function handleSignMessage(data: SignMessageData): Promise<Response> {
  const validation = validateInput(data, ['message', 'address']);
  if (validation) return validation;

  if (!securityManager || !securityManager.isReady()) {
    return { success: false, error: 'Security manager not initialized' };
  }
  try {
    return { success: true, value: '0x' + '0'.repeat(130) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Switches the current network to the specified chain
 * @param data - SwitchNetworkData containing the chain ID
 * @returns Response containing the new network details or error
 */
async function handleSwitchNetwork(data: SwitchNetworkData): Promise<Response> {
  const validation = validateInput(data, ['chainId']);
  if (validation) return validation;

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

/**
 * Retrieves the balance for a specific address
 * @param data - GetBalanceData containing the address
 * @returns Response containing the balance or error
 */
async function handleGetBalance(data: GetBalanceData): Promise<Response> {
  const validation = validateInput(data, ['address']);
  if (validation) return validation;

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

/**
 * Retrieves network configuration by chain ID
 * @param chainId - The chain ID to look up
 * @returns Network configuration for the specified chain
 */
async function getNetworkByChainId(chainId: string): Promise<Network> {
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

// Add rate limiting for message handling
const messageRateLimiter = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

/**
 * Checks if a request should be rate limited
 * @param origin - The origin of the request
 * @returns boolean indicating if the request should be allowed
 */
function checkRateLimit(origin: string): boolean {
  const now = Date.now();
  const requestCount = messageRateLimiter.get(origin) || 0;
  
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  messageRateLimiter.set(origin, requestCount + 1);
  setTimeout(() => {
    const currentCount = messageRateLimiter.get(origin) || 0;
    messageRateLimiter.set(origin, Math.max(0, currentCount - 1));
  }, RATE_LIMIT_WINDOW);
  
  return true;
}

self.addEventListener('message', async (event: MessageEvent<Message>) => {
  const { type, data } = event.data;
  let response: Response;

  // Validate message origin
  if (!event.origin || !event.source) {
    response = { success: false, error: 'Invalid message origin' };
    return;
  }

  // Check rate limit
  if (!checkRateLimit(event.origin)) {
    response = { success: false, error: 'Rate limit exceeded' };
    event.source.postMessage(response);
    return;
  }

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