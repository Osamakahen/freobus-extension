import { injectProvider } from "./provider"
import { sendToBackground } from "@plasmohq/messaging"

// Inject provider as early as possible
injectProvider()

// Network observer for dApp network requirements
const networkObserver = new MutationObserver(() => {
  const networkBadge = document.querySelector('.network-badge')
  if (networkBadge) {
    const networkText = networkBadge.textContent?.toLowerCase()
    if (networkText?.includes('polygon')) {
      sendToBackground({
        name: "wallet",
        body: {
          type: "SWITCH_CHAIN",
          payload: {
            origin: window.location.origin,
            chainId: "0x89"
          }
        }
      })
    } else if (networkText?.includes('ethereum')) {
      sendToBackground({
        name: "wallet",
        body: {
          type: "SWITCH_CHAIN",
          payload: {
            origin: window.location.origin,
            chainId: "0x1"
          }
        }
      })
    }
  }
})

// Start observing when provider is injected
networkObserver.observe(document.body, {
  childList: true,
  subtree: true
})

// Listen for messages from the page
window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return
  if (!event.data?.type?.startsWith("FREOBUS_")) return

  // Handle page messages
  const { type, payload } = event.data
  switch (type) {
    case "FREOBUS_READY":
      // Notify the page that the provider is ready
      window.postMessage({ type: "FREOBUS_PROVIDER_READY" }, "*")
      break
    // Add more message handlers as needed
  }
}) 