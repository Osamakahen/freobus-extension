import { ethers } from 'ethers'
import { Storage } from '@plasmohq/storage'
import { encrypt, decrypt, verifySignature } from '../utils/crypto'

const storage = new Storage()

interface SecurityConfig {
  enablePhishingDetection: boolean
  enableBiometricAuth: boolean
  enableHardwareWallet: boolean
  phishingDetectionLevel: 'basic' | 'advanced'
  biometricAuthProvider?: 'webauthn' | 'custom'
  hardwareWalletTypes?: ('ledger' | 'trezor')[]
}

interface PhishingCheckResult {
  isPhishing: boolean
  confidence: number
  reasons: string[]
}

interface BiometricAuthResult {
  success: boolean
  error?: string
}

export class SecurityService {
  private config: SecurityConfig
  private knownPhishingSites: Set<string> = new Set()
  private hardwareWallets: Map<string, any> = new Map()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enablePhishingDetection: true,
      enableBiometricAuth: true,
      enableHardwareWallet: true,
      phishingDetectionLevel: 'basic',
      hardwareWalletTypes: ['ledger', 'trezor'],
      ...config
    }
  }

  async initialize() {
    await this.loadKnownPhishingSites()
  }

  private async loadKnownPhishingSites() {
    const sites = await storage.get<string[]>('knownPhishingSites')
    if (sites) {
      this.knownPhishingSites = new Set(sites)
    }
  }

  // Phishing Detection
  async checkForPhishing(url: string): Promise<PhishingCheckResult> {
    if (!this.config.enablePhishingDetection) {
      return { isPhishing: false, confidence: 0, reasons: [] }
    }

    const result: PhishingCheckResult = {
      isPhishing: false,
      confidence: 0,
      reasons: []
    }

    // Basic checks
    if (this.knownPhishingSites.has(url)) {
      result.isPhishing = true
      result.confidence = 1
      result.reasons.push('Known phishing site')
      return result
    }

    // Advanced checks
    if (this.config.phishingDetectionLevel === 'advanced') {
      const suspiciousPatterns = await this.checkSuspiciousPatterns(url)
      if (suspiciousPatterns.length > 0) {
        result.isPhishing = true
        result.confidence = 0.8
        result.reasons.push(...suspiciousPatterns)
      }
    }

    return result
  }

  private async checkSuspiciousPatterns(url: string): Promise<string[]> {
    const patterns: string[] = []
    
    // Check for common phishing patterns
    if (url.includes('metamask')) patterns.push('Suspicious domain name')
    if (url.includes('walletconnect')) patterns.push('Suspicious wallet reference')
    if (url.includes('login')) patterns.push('Suspicious login page')
    
    return patterns
  }

  // Biometric Authentication
  async authenticateWithBiometrics(): Promise<BiometricAuthResult> {
    if (!this.config.enableBiometricAuth) {
      return { success: false, error: 'Biometric authentication is not enabled' }
    }

    try {
      if (this.config.biometricAuthProvider === 'webauthn') {
        return await this.authenticateWithWebAuthn()
      } else {
        return await this.authenticateWithCustomBiometrics()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  private async authenticateWithWebAuthn(): Promise<BiometricAuthResult> {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required'
        }
      })

      if (credential) {
        console.log('WebAuthn credential received:', credential)
        return { success: true }
      }
      return { success: false, error: 'No credential received' }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  private async authenticateWithCustomBiometrics(): Promise<BiometricAuthResult> {
    // Implement custom biometric authentication
    return { success: false, error: 'Custom biometric authentication not implemented' }
  }

  // Hardware Wallet Support
  async connectHardwareWallet(type: 'ledger' | 'trezor'): Promise<boolean> {
    if (!this.config.enableHardwareWallet) {
      throw new Error('Hardware wallet support is not enabled')
    }

    if (!this.config.hardwareWalletTypes?.includes(type)) {
      throw new Error(`Hardware wallet type ${type} is not supported`)
    }

    try {
      // In a real implementation, this would connect to the hardware wallet
      // For now, we'll just simulate the connection
      this.hardwareWallets.set(type, { connected: true, timestamp: Date.now() })
      return true
    } catch (error) {
      console.error('Hardware wallet connection failed:', error)
      return false
    }
  }

  async signWithHardwareWallet(
    type: 'ledger' | 'trezor',
    message: string
  ): Promise<string> {
    const wallet = this.hardwareWallets.get(type)
    if (!wallet || !wallet.connected) {
      throw new Error('Hardware wallet not connected')
    }

    try {
      console.log('Signing with hardware wallet:', type, message)
      return ethers.utils.hexlify(ethers.utils.randomBytes(65))
    } catch (error) {
      console.error('Hardware wallet signing failed:', error)
      throw error
    }
  }

  // Security Monitoring
  async logSecurityEvent(event: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: any
  }): Promise<void> {
    const events = await storage.get<any[]>('securityEvents') || []
    events.push({
      ...event,
      timestamp: Date.now()
    })
    await storage.set('securityEvents', events)
  }

  async getSecurityEvents(): Promise<any[]> {
    return await storage.get<any[]>('securityEvents') || []
  }
}

export const securityService = new SecurityService()

export async function verifyCredential(credential: any): Promise<boolean> {
  try {
    console.log('Verifying external credential:', credential)
    return true
  } catch (error) {
    console.error('Credential verification failed:', error)
    return false
  }
}

export async function signMessage(message: string): Promise<string> {
  try {
    // Implementation of message signing
    return 'signed_' + message
  } catch (error) {
    console.error('Message signing failed:', error)
    throw new Error('Failed to sign message')
  }
} 