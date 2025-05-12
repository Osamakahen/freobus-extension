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

// Listen for messages from the inpage provider
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message && message.type === 'FREOBUS_REQUEST') {
    const { id, args } = message;
    let result, error;
    try {
      if (args.method === 'eth_accounts' || args.method === 'eth_requestAccounts') {
        // Use walletService to check unlock status and get accounts
        const state = await import('../shared/services/wallet');
        const walletService = state.walletService;
        const walletState = await walletService.getState();
        console.log('WalletState:', walletState); // Debug log
        if (walletState.isUnlocked && walletState.accounts.length > 0) {
          result = walletState.accounts.map(a => a.address);
        } else {
          result = [];
        }
      } else {
        // Handle other methods or ignore
        result = null;
      }
    } catch (e: any) {
      error = e.message || 'Unknown error';
    }
    sendResponse({ type: 'FREOBUS_RESPONSE', id, result, error });
    return true;
  }
});

export default handleMessage 