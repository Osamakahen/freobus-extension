import { EventEmitter } from 'events'

export class NetworkStateManager extends EventEmitter {
  private currentNetwork: string = 'ethereum'
  private networks: string[] = ['ethereum', 'polygon']
  private networkState: any = {}
  private readonly MAX_GAS_PRICE = '100000000000000000' // 0.1 ETH

  constructor() {
    super()
  }

  getAvailableNetworks(): string[] {
    return this.networks
  }

  getCurrentNetwork(): string {
    return this.currentNetwork
  }

  getNetworkState(): any {
    return this.networkState
  }

  validateNetworkConfig(config: any): boolean {
    if (!config.chainId || !config.rpcUrl || !config.name || !config.symbol) {
      return false
    }

    // Validate RPC URL format
    try {
      new URL(config.rpcUrl)
      return true
    } catch {
      return false
    }
  }

  async switchNetwork(network: string): Promise<void> {
    if (!this.networks.includes(network)) {
      throw new Error(`Network ${network} not supported`)
    }
    this.currentNetwork = network
    this.emit('networkChanged', network)
  }

  validateTransaction(tx: any): boolean {
    if (!tx.gasPrice || !tx.gasLimit || !tx.to || !tx.value) {
      return false
    }

    // Validate gas price is not too high
    if (BigInt(tx.gasPrice) > BigInt(this.MAX_GAS_PRICE)) {
      return false
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
      return false
    }

    return true
  }

  async updateNetworkState(): Promise<void> {
    this.networkState = { 
      network: this.currentNetwork,
      timestamp: Date.now()
    }
    this.emit('stateChanged', this.networkState)
  }

  cleanup(): void {
    this.removeAllListeners()
  }
} 