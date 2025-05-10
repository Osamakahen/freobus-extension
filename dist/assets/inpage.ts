// Extend the Window interface for TypeScript
interface FreoBusWindow extends Window {
  ethereum?: any;
  FreoBus?: any;
}

// Inject the FreoBus provider into the page context
(function() {
  // This function will be stringified and injected
  function inject() {
    const w = window as FreoBusWindow;
    if (w.ethereum || w.FreoBus) return;

    // Minimal event emitter
    const listeners: Record<string, Set<(...args: any[]) => void>> = {};
    const on = (event: string, handler: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(handler);
    };
    const removeListener = (event: string, handler: (...args: any[]) => void) => {
      listeners[event]?.delete(handler);
    };
    const emit = (event: string, ...args: any[]) => {
      listeners[event]?.forEach(fn => fn(...args));
    };

    // The provider object should be compatible with EIP-1193
    const provider = {
      isFreoWallet: true,
      isMetaMask: true,
      request: async (args: { method: string; params?: any[] }) => {
        // Example: emit events for demo purposes
        if (args.method === 'eth_chainId') emit('chainChanged', '0xaa36a7');
        return window.postMessage({ type: 'FREOBUS_REQUEST', args }, '*');
      },
      on,
      removeListener,
      isConnected: () => true,
      chainId: '0xaa36a7',
      selectedAddress: null,
      enable: async () => []
    };
    w.ethereum = provider;
    w.FreoBus = provider;
    console.log('FreoBus inpage provider injected');
  }
  inject();
})();

export {} 