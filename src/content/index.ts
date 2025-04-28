import { injectProvider } from "./provider"
import { sendToBackground, type MessageName } from "@plasmohq/messaging"
import type { WalletRequest } from "../background/wallet-handler"

// Inject provider as early as possible
injectProvider()

async function switchNetwork(chainId: string) {
  const response = await sendToBackground({
    name: "wallet" as MessageName,
    body: {
      type: "SWITCH_CHAIN",
      payload: {
        origin: window.location.origin,
        chainId
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
window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (!event.data?.type?.startsWith("FREOBUS_")) return

  const { type } = event.data
  switch (type) {
    case "FREOBUS_READY":
      window.postMessage({ type: "FREOBUS_PROVIDER_READY" }, "*")
      break
  }
}) 