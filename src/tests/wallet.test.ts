import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { walletService } from '../shared/services/wallet'
import { ethers } from 'ethers'
import { mockStorage } from './setup/mockStorage'

describe('WalletService', () => {
  beforeEach(async () => {
    // Clear storage and reset wallet service
    await mockStorage.clear()
    await walletService.disconnectSite('test-origin')
  })

  afterEach(async () => {
    // Clean up after each test
    await mockStorage.clear()
    await walletService.disconnectSite('test-origin')
  })

  describe('Session Management', () => {
    it('should create and retrieve a session', async () => {
      const origin = 'test-origin'
      const accounts = ['0x1234567890123456789012345678901234567890']
      const permissions = ['eth_accounts', 'eth_chainId']

      await walletService.connectSite(origin, accounts, permissions)
      const session = await walletService.getSession(origin)

      expect(session).toBeDefined()
      expect(session?.accounts).toEqual(accounts)
      expect(session?.permissions.eth_accounts).toBe(true)
      expect(session?.permissions.eth_chainId).toBe(true)
    })

    it('should handle auto-connect', async () => {
      const origin = 'test-origin'
      const accounts = ['0x1234567890123456789012345678901234567890']
      const permissions = ['eth_accounts']

      await walletService.connectSite(origin, accounts, permissions)
      const shouldAutoConnect = await walletService.shouldAutoConnect(origin)

      expect(shouldAutoConnect).toBe(true)
    })

    it('should respect session timeout', async () => {
      const origin = 'test-origin'
      const accounts = ['0x1234567890123456789012345678901234567890']
      const permissions = ['eth_accounts']

      // Create a session with an old timestamp
      await walletService.connectSite(origin, accounts, permissions)
      const session = await walletService.getSession(origin)
      if (session) {
        session.lastConnected = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
        await mockStorage.set('walletState', JSON.stringify({ 
          connectedSites: { [origin]: session } 
        }))
      }

      const shouldAutoConnect = await walletService.shouldAutoConnect(origin)
      expect(shouldAutoConnect).toBe(false)
    })
  })

  describe('Network Management', () => {
    it('should update network for a session', async () => {
      const origin = 'test-origin'
      const accounts = ['0x1234567890123456789012345678901234567890']
      const permissions = ['eth_accounts']

      // Initialize wallet state with networks
      const initialState = {
        isUnlocked: true,
        accounts: [],
        networks: [
          {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
            currencySymbol: 'ETH',
            blockExplorerUrl: 'https://etherscan.io'
          },
          {
            chainId: '0x89',
            name: 'Polygon Mainnet',
            rpcUrl: 'https://polygon-rpc.com',
            currencySymbol: 'MATIC',
            blockExplorerUrl: 'https://polygonscan.com'
          }
        ],
        selectedNetwork: {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
          currencySymbol: 'ETH',
          blockExplorerUrl: 'https://etherscan.io'
        },
        connectedSites: {}
      }

      // Set initial state
      await mockStorage.set('walletState', JSON.stringify(initialState))

      // Connect site and update network
      await walletService.connectSite(origin, accounts, permissions)
      await walletService.updateNetwork(origin, '0x89')

      // Wait for the debounced network update
      await new Promise(resolve => setTimeout(resolve, 600))

      const session = await walletService.getSession(origin)
      expect(session?.chainId).toBe('0x89')
    })
  })

  describe('Message Signing', () => {
    it('should sign a message', async () => {
      // Initialize wallet state
      const password = 'test-password'
      const wallet = ethers.Wallet.createRandom()
      const salt = ethers.utils.randomBytes(32)
      const iv = ethers.utils.randomBytes(16)

      const initialState = {
        isUnlocked: true,
        accounts: [{
          address: wallet.address,
          name: 'Test Account',
          index: 0,
          balances: {}
        }],
        networks: [],
        selectedNetwork: null,
        connectedSites: {}
      }

      const vault = {
        encryptedSeed: wallet.mnemonic.phrase, // In real implementation, this would be encrypted
        salt: ethers.utils.hexlify(salt),
        iv: ethers.utils.hexlify(iv),
        version: 1
      }

      await mockStorage.set('vault', vault)
      await mockStorage.set('walletState', JSON.stringify(initialState))

      const message = 'Hello, World!'
      const signature = await wallet.signMessage(message)

      // Verify the signature
      const recoveredAddress = ethers.utils.verifyMessage(message, signature)
      expect(recoveredAddress.toLowerCase()).toBe(wallet.address.toLowerCase())
    })
  })
}) 