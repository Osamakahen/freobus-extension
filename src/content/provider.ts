import type { RequestArguments } from "eip1193-provider"
import { sendToBackground } from "@plasmohq/messaging"
import type { WalletMessage } from "../background"

class FreoBusProvider {
  private connected: boolean = false
  private accounts: string[] = []
  private chainId: string = "0x1" // Mainnet by default
  private listeners: { [event: string]: ((...args: any[]) => void)[] } = {}

  constructor() {
    this.initialize()
  }

  private async initialize() {
    const origin = window.location.origin
    const response = await sendToBackground<WalletMessage>({
      name: "wallet",
      body: {
        type: "GET_SESSION",
        payload: { origin }
      }
    })

    if (response.success && response.session) {
      this.connected = true
      this.accounts = response.session.accounts
      this.chainId = response.session.chainId

      // Emit events
      this._emit('connect', { chainId: this.chainId })
      this._emit('accountsChanged', this.accounts)
      this._emit('chainChanged', this.chainId)
    }
  }

  // Required EIP-1193 methods
  async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args

    switch (method) {
      case "eth_requestAccounts":
      case "eth_accounts":
        return this.accounts

      case "eth_chainId":
        return this.chainId

      case "eth_sendTransaction":
        return this.sendTransaction(params[0])

      case "personal_sign":
        return this.signMessage(params[0], params[1])

      case "wallet_switchEthereumChain":
        return this.switchChain(params[0].chainId)

      default:
        throw new Error(`Method ${method} not supported`)
    }
  }

  private async sendTransaction(txParams: any) {
    const response = await sendToBackground<WalletMessage>({
      name: "wallet",
      body: {
        type: "SIGN_TRANSACTION",
        payload: txParams
      }
    })
    return response
  }

  private async signMessage(message: string, address: string) {
    const response = await sendToBackground<WalletMessage>({
      name: "wallet",
      body: {
        type: "SIGN_MESSAGE",
        payload: { message, address }
      }
    })
    return response
  }

  private async switchChain(chainId: string) {
    const response = await sendToBackground<WalletMessage>({
      name: "wallet",
      body: {
        type: "SWITCH_CHAIN",
        payload: { chainId }
      }
    })

    if (response.success) {
      this.chainId = chainId
      this._emit('chainChanged', chainId)
    }

    return response
  }

  // Event handling
  on(eventName: string, handler: (...args: any[]) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(handler)
  }

  removeListener(eventName: string, handler: (...args: any[]) => void) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(h => h !== handler)
    }
  }

  private _emit(eventName: string, ...args: any[]) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(handler => handler(...args))
    }
  }
}

// Inject provider into window.ethereum
declare global {
  interface Window {
    ethereum: FreoBusProvider
  }
}

export const injectProvider = () => {
  if (typeof window.ethereum !== "undefined") {
    console.warn("An ethereum provider is already present")
    return
  }

  window.ethereum = new FreoBusProvider()
} 