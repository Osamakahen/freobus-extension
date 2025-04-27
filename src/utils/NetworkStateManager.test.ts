import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NetworkStateManager } from './NetworkStateManager'

describe('NetworkStateManager', () => {
  let networkManager: NetworkStateManager

  beforeEach(() => {
    networkManager = new NetworkStateManager()
  })

  afterEach(() => {
    networkManager.cleanup()
  })

  it('should initialize with default networks', () => {
    expect(networkManager.getAvailableNetworks()).toContain('ethereum')
    expect(networkManager.getAvailableNetworks()).toContain('polygon')
  })

  it('should validate network configurations', () => {
    const validConfig = {
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
      name: 'Ethereum Mainnet',
      symbol: 'ETH'
    }

    const invalidConfig = {
      chainId: 1,
      rpcUrl: 'invalid-url',
      name: 'Invalid Network',
      symbol: 'INV'
    }

    expect(networkManager.validateNetworkConfig(validConfig)).toBe(true)
    expect(networkManager.validateNetworkConfig(invalidConfig)).toBe(false)
  })

  it('should handle network switching', async () => {
    const switchListener = vi.fn()
    networkManager.on('networkChanged', switchListener)

    await networkManager.switchNetwork('polygon')
    expect(switchListener).toHaveBeenCalledWith('polygon')
    expect(networkManager.getCurrentNetwork()).toBe('polygon')
  })

  it('should validate transactions', () => {
    const validTx = {
      gasPrice: '1000000000',
      gasLimit: '21000',
      to: '0x1234567890123456789012345678901234567890',
      value: '1000000000000000000'
    }

    const invalidTx = {
      gasPrice: '1000000000000000000', // Too high
      gasLimit: '21000',
      to: '0x1234567890123456789012345678901234567890',
      value: '1000000000000000000'
    }

    expect(networkManager.validateTransaction(validTx)).toBe(true)
    expect(networkManager.validateTransaction(invalidTx)).toBe(false)
  })

  it('should track network state', async () => {
    const stateListener = vi.fn()
    networkManager.on('stateChanged', stateListener)

    await networkManager.updateNetworkState()
    expect(stateListener).toHaveBeenCalled()
    expect(networkManager.getNetworkState()).toBeDefined()
  })
}) 