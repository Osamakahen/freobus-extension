import { vi } from 'vitest';

// Mock chrome.runtime with minimal implementation
global.chrome = {
  runtime: {
    sendMessage: vi.fn((_: any, callback: (response: any) => void) => {
      callback({ success: true, value: { chainId: '0x1' } });
    }),
  },
} as any;

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: undefined,
}); 