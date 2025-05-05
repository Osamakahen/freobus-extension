import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeProvider } from '../provider';
import { EventEmitter } from 'events';

interface MockMessage {
  type: string;
  data: any;
}

interface MockResponse {
  success: boolean;
  value?: any;
  error?: string;
}

describe('FreoBusProvider', () => {
  beforeEach(() => {
    // Clear window.ethereum before each test
    (window as any).ethereum = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    (window as any).ethereum = undefined;
  });

  it('should inject provider into window.ethereum', () => {
    initializeProvider();
    expect((window as any).ethereum).toBeDefined();
    expect((window as any).ethereum.isFreoWallet).toBe(true);
  });

  it('should implement EIP-1193 methods', () => {
    initializeProvider();
    const provider = (window as any).ethereum;
    
    expect(provider.request).toBeDefined();
    expect(provider.send).toBeDefined();
    expect(provider.on).toBeDefined();
    expect(provider.removeListener).toBeDefined();
    expect(provider.isConnected).toBeDefined();
    expect(provider.chainId).toBeDefined();
    expect(provider.selectedAddress).toBeDefined();
  });

  it('should handle request method', async () => {
    initializeProvider();
    const provider = (window as any).ethereum;
    
    // Mock chrome.runtime.sendMessage
    const mockResponse: MockResponse = { success: true, value: { chainId: '0x1' } };
    (chrome.runtime.sendMessage as any).mockImplementation((_: MockMessage, callback: (response: MockResponse) => void) => {
      callback(mockResponse);
    });

    const result = await provider.request({ method: 'eth_chainId' });
    expect(result).toEqual({ chainId: '0x1' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'eth_chainId',
        data: { params: undefined }
      }),
      expect.any(Function)
    );
  });

  it('should handle send method with callback', async () => {
    initializeProvider();
    const provider = (window as any).ethereum;
    
    // Mock chrome.runtime.sendMessage
    const mockResponse: MockResponse = { success: true, value: { chainId: '0x1' } };
    (chrome.runtime.sendMessage as any).mockImplementation((_: MockMessage, callback: (response: MockResponse) => void) => {
      callback(mockResponse);
    });

    const result = await new Promise((resolve) => {
      provider.send({ method: 'eth_chainId' }, (error: any, result: any) => {
        expect(error).toBeNull();
        expect(result).toEqual({ chainId: '0x1' });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'eth_chainId',
            data: { params: undefined }
          }),
          expect.any(Function)
        );
        resolve(result);
      });
    });

    expect(result).toEqual({ chainId: '0x1' });
  });

  it('should handle events', async () => {
    initializeProvider();
    const provider = (window as any).ethereum;
    
    const mockHandler = vi.fn();
    provider.on('accountsChanged', mockHandler);
    
    // Get the internal EventEmitter instance
    const emitter = (provider as any)._eventEmitter as EventEmitter;
    
    // Emit the event using the internal EventEmitter
    emitter.emit('accountsChanged', ['0x123']);
    
    expect(mockHandler).toHaveBeenCalledWith(['0x123']);
  });

  it('should handle removeListener', async () => {
    initializeProvider();
    const provider = (window as any).ethereum;
    
    const mockHandler = vi.fn();
    provider.on('accountsChanged', mockHandler);
    provider.removeListener('accountsChanged', mockHandler);
    
    // Get the internal EventEmitter instance
    const emitter = (provider as any)._eventEmitter as EventEmitter;
    
    // Emit the event using the internal EventEmitter
    emitter.emit('accountsChanged', ['0x123']);
    
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle initialization error', async () => {
    // Mock chrome.runtime.sendMessage to throw an error
    (chrome.runtime.sendMessage as any).mockImplementation((_: MockMessage, callback: (response: MockResponse) => void) => {
      callback({ success: false, error: 'Permission denied' });
    });

    initializeProvider();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const provider = (window as any).ethereum;
    expect(provider.isConnected()).toBe(false);
  });
}); 