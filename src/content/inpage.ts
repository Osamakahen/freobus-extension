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
      request: (args: { method: string; params?: any[] }) => {
        return new Promise((resolve, reject) => {
          const id = Math.random().toString(36).slice(2);
          window.addEventListener("message", function handler(event) {
            if (event.data && event.data.id === id && event.data.type === "FREOBUS_RESPONSE") {
              window.removeEventListener("message", handler);
              if (event.data.error) reject(event.data.error);
              else resolve(event.data.result);
            }
          });
          window.postMessage({ type: "FREOBUS_REQUEST", id, args }, "*");
        });
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