/// <reference types="chrome"/>
import type { PlasmoMessaging } from "@plasmohq/messaging"
import handleWalletRequest from "./wallet-handler"

// Initialize wallet when extension is installed
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === "install") {
    console.log("FreoBus Extension installed")
    // Show onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/index.html")
    })
  }
})

// Message handler
const handleMessage: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { name } = req

  switch (name) {
    case "wallet":
      return handleWalletRequest(req, res)
    default:
      throw new Error(`Unknown message name: ${name}`)
  }
}

export default handleMessage 