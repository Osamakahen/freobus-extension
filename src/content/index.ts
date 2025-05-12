import { initializeProvider } from "./provider"
import { sendToBackground, type MessageName } from "@plasmohq/messaging"
import type { WalletRequest } from "../background/wallet-handler"

// Inject inpage.js into the page context
(function injectInpage() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('assets/inpage.js');
  script.type = 'text/javascript';
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
})();

// Inject provider as early as possible
initializeProvider()

function toHexChainId(chainId: string | number): string {
  if (typeof chainId === "number") return "0x" + chainId.toString(16);
  if (typeof chainId === "string" && chainId.startsWith("0x")) return chainId.toLowerCase();
  return "0x" + parseInt(chainId as string, 10).toString(16);
}

async function switchNetwork(chainId: string) {
  const response = await sendToBackground({
    name: "wallet" as MessageName,
    body: {
      type: "SWITCH_CHAIN",
      payload: {
        origin: window.location.origin,
        chainId: toHexChainId(chainId)
      }
    } as WalletRequest
  })
  return response
}

// Network observer for dApp network requirements
const networkObserver = new MutationObserver(() => {
  const networkBadge = document.querySelector('.network-badge')
  if (networkBadge) {
    const networkText = networkBadge.textContent?.toLowerCase()
    if (networkText?.includes('polygon')) {
      switchNetwork("0x89")
    } else if (networkText?.includes('ethereum')) {
      switchNetwork("0x1")
    }
  }
})

// Start observing when provider is injected
networkObserver.observe(document.body, {
  childList: true,
  subtree: true
})

// Listen for messages from the page
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "FREOBUS_REQUEST") return;

  const { id, args } = event.data;
  try {
    // Forward to background and get result
    const result = await sendToBackground({
      name: "wallet" as MessageName,
      body: {
        type: args.method,
        payload: args.params
      } as WalletRequest
    });
    window.postMessage({ type: "FREOBUS_RESPONSE", id, result }, "*");
  } catch (error) {
    window.postMessage({ type: "FREOBUS_RESPONSE", id, error: error instanceof Error ? error.message : String(error) }, "*");
  }
}); 