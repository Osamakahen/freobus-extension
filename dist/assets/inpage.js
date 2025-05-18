(function() {
  if (window.ethereum) return;
  const listeners = {};
  window.ethereum = {
    isFreoWallet: true,
    isMetaMask: true,
    request: (args) => {
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
    on: (event, fn) => { (listeners[event] = listeners[event] || []).push(fn); },
    removeListener: (event, fn) => {
      if (listeners[event]) listeners[event] = listeners[event].filter(f => f !== fn);
    }
  };
})(); 