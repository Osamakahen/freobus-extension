import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { securityService } from '../shared/services/security'
import { mockStorage } from './setup/mockStorage'

describe('SecurityService', () => {
  beforeEach(async () => {
    await mockStorage.clear()
  })

  afterEach(async () => {
    await mockStorage.clear()
  })

  describe('Phishing Detection', () => {
    it('should detect known phishing sites', async () => {
      const phishingUrl = 'https://metamask-phishing.com'
      await mockStorage.set('knownPhishingSites', [phishingUrl])
      
      const result = await securityService.checkForPhishing(phishingUrl)
      expect(result.isPhishing).toBe(true)
      expect(result.confidence).toBe(1)
      expect(result.reasons).toContain('Known phishing site')
    })

    it('should detect suspicious patterns in advanced mode', async () => {
      const suspiciousUrl = 'https://metamask-login.com'
      const result = await securityService.checkForPhishing(suspiciousUrl)
      
      expect(result.isPhishing).toBe(true)
      expect(result.confidence).toBe(0.8)
      expect(result.reasons).toContain('Suspicious domain name')
      expect(result.reasons).toContain('Suspicious login page')
    })

    it('should return false for safe sites', async () => {
      const safeUrl = 'https://example.com'
      const result = await securityService.checkForPhishing(safeUrl)
      
      expect(result.isPhishing).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.reasons).toHaveLength(0)
    })
  })

  describe('Biometric Authentication', () => {
    it('should handle WebAuthn authentication', async () => {
      // Mock WebAuthn
      const mockCredential = { id: 'test-id' }
      vi.spyOn(navigator.credentials, 'get').mockResolvedValue(mockCredential as any)

      const result = await securityService.authenticateWithBiometrics()
      expect(result.success).toBe(true)
    })

    it('should handle WebAuthn errors', async () => {
      vi.spyOn(navigator.credentials, 'get').mockRejectedValue(new Error('Authentication failed'))

      const result = await securityService.authenticateWithBiometrics()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed')
    })
  })

  describe('Hardware Wallet Support', () => {
    it('should connect to supported hardware wallets', async () => {
      const result = await securityService.connectHardwareWallet('ledger')
      expect(result).toBe(true)
    })

    it('should reject unsupported hardware wallets', async () => {
      await expect(securityService.connectHardwareWallet('unsupported' as any))
        .rejects
        .toThrow('Hardware wallet type unsupported is not supported')
    })

    it('should sign messages with connected hardware wallets', async () => {
      await securityService.connectHardwareWallet('ledger')
      const signature = await securityService.signWithHardwareWallet('ledger', 'test message')
      
      expect(signature).toBeDefined()
      expect(signature.startsWith('0x')).toBe(true)
    })
  })

  describe('Security Monitoring', () => {
    it('should log security events', async () => {
      const event = {
        type: 'phishing_detected',
        severity: 'high' as const,
        details: { url: 'https://phishing.com' }
      }

      await securityService.logSecurityEvent(event)
      const events = await securityService.getSecurityEvents()
      
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('phishing_detected')
      expect(events[0].severity).toBe('high')
      expect(events[0].timestamp).toBeDefined()
    })

    it('should retrieve security events in chronological order', async () => {
      const events = [
        {
          type: 'event1',
          severity: 'low' as const,
          details: {},
          timestamp: Date.now() - 1000
        },
        {
          type: 'event2',
          severity: 'medium' as const,
          details: {},
          timestamp: Date.now()
        }
      ]

      await mockStorage.set('securityEvents', events)
      const retrievedEvents = await securityService.getSecurityEvents()
      
      expect(retrievedEvents).toHaveLength(2)
      expect(retrievedEvents[0].type).toBe('event1')
      expect(retrievedEvents[1].type).toBe('event2')
    })
  })
}) 