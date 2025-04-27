/// <reference types="chrome"/>
import type { PlasmoMessaging } from "@plasmohq/messaging"
import handleWalletRequest from "./wallet-handler"

export interface WalletMessage {
  name: string;
  body: {
    type: "CREATE_WALLET" | "UNLOCK_WALLET" | "ADD_ACCOUNT" | "SIGN_TRANSACTION" | 
          "CONNECT_SITE" | "DISCONNECT_SITE" | "SET_NETWORK" | "GET_SESSION" | 
          "SIGN_MESSAGE" | "SWITCH_CHAIN";
    payload?: any;
  };
}

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
      await handleWalletRequest(req, res)
      return
    default:
      throw new Error(`Unknown message name: ${name}`)
  }
}

export default handleMessage 