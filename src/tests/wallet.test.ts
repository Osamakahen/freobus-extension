import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { walletService } from '../shared/services/wallet'
import { ethers } from 'ethers'

describe('WalletService', () => {
  beforeEach(async () => {
    // Clear any existing state
    await walletService.disconnectSite('test-origin')
  })

  afterEach(async () => {
    // Clean up after each test
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

      await walletService.connectSite(origin, accounts, permissions)
      await walletService.updateNetwork(origin, '0x89') // Polygon

      const session = await walletService.getSession(origin)
      expect(session?.chainId).toBe('0x89')
    })
  })

  describe('Message Signing', () => {
    it('should sign a message', async () => {
      // Create a wallet first
      await walletService.createWallet('test-password')
      const account = await walletService.addAccount('Test Account')

      const message = 'Hello, World!'
      const signature = await walletService.signMessage(message, account.address)

      // Verify the signature
      const recoveredAddress = ethers.utils.verifyMessage(message, signature)
      expect(recoveredAddress.toLowerCase()).toBe(account.address.toLowerCase())
    })
  })
}) 