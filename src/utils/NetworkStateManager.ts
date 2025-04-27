import { EventEmitter } from 'events'

export class NetworkStateManager extends EventEmitter {
  private currentNetwork: string = 'ethereum'
  private networks: string[] = ['ethereum', 'polygon']
  private networkState: any = {}

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
    return config.chainId && config.rpcUrl && config.name && config.symbol
  }

  async switchNetwork(network: string): Promise<void> {
    if (!this.networks.includes(network)) {
      throw new Error(`Network ${network} not supported`)
    }
    this.currentNetwork = network
    this.emit('networkChanged', network)
  }

  validateTransaction(tx: any): boolean {
    return tx.gasPrice && tx.gasLimit && tx.to && tx.value
  }

  async updateNetworkState(): Promise<void> {
    this.networkState = { network: this.currentNetwork }
    this.emit('stateChanged', this.networkState)
  }

  cleanup(): void {
    this.removeAllListeners()
  }
} 