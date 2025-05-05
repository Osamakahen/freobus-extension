import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Message, SignTransactionData } from '../types';
import { SecurityManager } from '../security/SecurityManager';
import { StateManager } from '../state/StateManager';
import { BigNumber } from 'ethers';

// Mock the global self object
const mockSelf = {
  addEventListener: vi.fn(),
  postMessage: vi.fn()
};
(global as any).self = mockSelf;

// Mock the SecurityManager and StateManager
vi.mock('../security/SecurityManager');
vi.mock('../state/StateManager');

describe('Service Worker Message Handlers', () => {
  let securityManager: SecurityManager;
  let stateManager: StateManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup SecurityManager mock
    securityManager = new SecurityManager();
    (securityManager.initialize as any) = vi.fn().mockResolvedValue(undefined);
    (securityManager.isReady as any) = vi.fn().mockReturnValue(true);
    (securityManager.storeData as any) = vi.fn().mockResolvedValue(undefined);
    (securityManager.retrieveData as any) = vi.fn().mockResolvedValue('test-value');
    (securityManager.hasPermission as any) = vi.fn().mockReturnValue(true);
    (securityManager.grantPermission as any) = vi.fn();

    // Setup StateManager mock
    stateManager = StateManager.getInstance();
    (stateManager.setNetwork as any) = vi.fn().mockResolvedValue(undefined);
    (stateManager.setBalance as any) = vi.fn().mockResolvedValue(undefined);
    (stateManager.addTransaction as any) = vi.fn().mockResolvedValue(undefined);
  });

  describe('handleInitialize', () => {
    it('should initialize security manager with password', async () => {
      const message: Message = {
        type: 'initialize',
        data: { password: 'test-password' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.initialize).toHaveBeenCalledWith('test-password');
      expect(event.source.postMessage).toHaveBeenCalledWith({ success: true });
    });

    it('should handle initialization error', async () => {
      (securityManager.initialize as any).mockRejectedValue(new Error('Initialization failed'));

      const message: Message = {
        type: 'initialize',
        data: { password: 'test-password' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Initialization failed'
      });
    });
  });

  describe('handleStoreData', () => {
    it('should store encrypted data', async () => {
      const message: Message = {
        type: 'storeData',
        data: { key: 'test-key', value: 'test-value' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.storeData).toHaveBeenCalledWith('test-key', 'test-value');
      expect(event.source.postMessage).toHaveBeenCalledWith({ success: true });
    });

    it('should handle missing security manager', async () => {
      (securityManager.isReady as any).mockReturnValue(false);

      const message: Message = {
        type: 'storeData',
        data: { key: 'test-key', value: 'test-value' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Security manager not initialized'
      });
    });
  });

  describe('handleRetrieveData', () => {
    it('should retrieve and decrypt data', async () => {
      const message: Message = {
        type: 'retrieveData',
        data: { key: 'test-key' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.retrieveData).toHaveBeenCalledWith('test-key');
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: true,
        value: 'test-value'
      });
    });
  });

  describe('handleCheckPermission', () => {
    it('should check permission status', async () => {
      const message: Message = {
        type: 'checkPermission',
        data: { origin: 'https://test.com', method: 'test-method' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.hasPermission).toHaveBeenCalledWith('https://test.com', 'test-method');
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: true,
        value: true
      });
    });
  });

  describe('handleGrantPermission', () => {
    it('should grant permissions', async () => {
      const message: Message = {
        type: 'grantPermission',
        data: {
          origin: 'https://test.com',
          methods: ['test-method'],
          expiresIn: 3600
        }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.grantPermission).toHaveBeenCalledWith(
        'https://test.com',
        ['test-method'],
        3600
      );
      expect(event.source.postMessage).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('handleSignTransaction', () => {
    it('should sign a transaction', async () => {
      const signTransactionData: SignTransactionData = {
        transaction: {
          to: "0x1234567890123456789012345678901234567890",
          from: "0x0987654321098765432109876543210987654321",
          value: BigNumber.from("1000000000000000000"),
          data: "0x",
          nonce: 0,
          gasLimit: BigNumber.from("21000"),
          gasPrice: BigNumber.from("20000000000"),
          chainId: "1"
        },
        origin: "https://test-dapp.com"
      };

      const message: Message = {
        type: 'signTransaction',
        data: signTransactionData
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(securityManager.signTransaction).toHaveBeenCalledWith(signTransactionData.transaction);
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: true,
        value: expect.any(String)
      });
    });
  });

  describe('handleSwitchNetwork', () => {
    it('should switch network', async () => {
      const message: Message = {
        type: 'switchNetwork',
        data: { chainId: '0x1' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(stateManager.setNetwork).toHaveBeenCalled();
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: true,
        value: expect.objectContaining({
          chainId: '0x1',
          name: 'Ethereum Mainnet'
        })
      });
    });
  });

  describe('handleGetBalance', () => {
    it('should get balance', async () => {
      const message: Message = {
        type: 'getBalance',
        data: { address: '0x123' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      await (global as any).self.addEventListener.mock.calls[0][1](event);

      expect(stateManager.setBalance).toHaveBeenCalledWith('0');
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: true,
        value: '0'
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit requests', async () => {
      const message: Message = {
        type: 'initialize',
        data: { password: 'test-password' }
      };

      const event = {
        data: message,
        origin: 'https://test.com',
        source: { postMessage: vi.fn() }
      };

      // Send more requests than allowed
      for (let i = 0; i < 101; i++) {
        await (global as any).self.addEventListener.mock.calls[0][1](event);
      }

      // Last request should be rate limited
      expect(event.source.postMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limit exceeded'
      });
    });
  });
}); 