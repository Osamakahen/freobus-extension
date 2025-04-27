import { ethers } from 'ethers'
import { Storage } from '@plasmohq/storage'
import { encrypt, decrypt } from '../utils/crypto'
import { generateQRCode } from '../utils/qr'

const storage = new Storage()

interface RecoveryConfig {
  enableCloudBackup: boolean
  enableSocialRecovery: boolean
  enableDeviceLinking: boolean
  cloudBackupProvider?: 'google' | 'apple' | 'custom'
  socialRecoveryThreshold?: number
  maxLinkedDevices?: number
}

interface RecoveryContact {
  address: string
  name: string
  publicKey: string
  isTrusted: boolean
}

interface DeviceLink {
  deviceId: string
  publicKey: string
  lastSync: number
  isActive: boolean
}

export class SessionRecoveryService {
  private config: RecoveryConfig
  private contacts: RecoveryContact[] = []
  private linkedDevices: DeviceLink[] = []

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      enableCloudBackup: true,
      enableSocialRecovery: true,
      enableDeviceLinking: true,
      socialRecoveryThreshold: 3,
      maxLinkedDevices: 5,
      ...config
    }
  }

  async initialize() {
    await this.loadState()
  }

  private async loadState() {
    const storedContacts = await storage.get<RecoveryContact[]>('recoveryContacts')
    const storedDevices = await storage.get<DeviceLink[]>('linkedDevices')
    
    if (storedContacts) this.contacts = storedContacts
    if (storedDevices) this.linkedDevices = storedDevices
  }

  private async saveState() {
    await storage.set('recoveryContacts', this.contacts)
    await storage.set('linkedDevices', this.linkedDevices)
  }

  // Cloud Backup Methods
  async createCloudBackup(encryptedData: string, password: string): Promise<string> {
    if (!this.config.enableCloudBackup) {
      throw new Error('Cloud backup is not enabled')
    }

    const backupKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(password))
    const encryptedBackup = await encrypt(encryptedData, backupKey)
    
    // In a real implementation, this would upload to a cloud provider
    await storage.set('cloudBackup', encryptedBackup)
    return encryptedBackup
  }

  async restoreFromCloudBackup(backupId: string, password: string): Promise<string> {
    const backupKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(password))
    const encryptedBackup = await storage.get<string>(backupId)
    
    if (!encryptedBackup) {
      throw new Error('Backup not found')
    }

    return decrypt(encryptedBackup, backupKey)
  }

  // Social Recovery Methods
  async addRecoveryContact(contact: RecoveryContact): Promise<void> {
    if (this.contacts.length >= (this.config.socialRecoveryThreshold || 3)) {
      throw new Error('Maximum number of recovery contacts reached')
    }

    this.contacts.push(contact)
    await this.saveState()
  }

  async initiateSocialRecovery(): Promise<string[]> {
    if (!this.config.enableSocialRecovery) {
      throw new Error('Social recovery is not enabled')
    }

    const requiredContacts = this.contacts.filter(c => c.isTrusted)
    if (requiredContacts.length < (this.config.socialRecoveryThreshold || 3)) {
      throw new Error('Not enough trusted contacts')
    }

    return requiredContacts.map(c => c.publicKey)
  }

  async completeSocialRecovery(signatures: string[]): Promise<boolean> {
    // Verify signatures from trusted contacts
    const validSignatures = await this.verifySignatures(signatures)
    return validSignatures.length >= (this.config.socialRecoveryThreshold || 3)
  }

  // Device Linking Methods
  async generateDeviceLinkQR(): Promise<string> {
    if (!this.config.enableDeviceLinking) {
      throw new Error('Device linking is not enabled')
    }

    const deviceId = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const publicKey = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    
    const linkData = {
      deviceId,
      publicKey,
      timestamp: Date.now()
    }

    return generateQRCode(JSON.stringify(linkData))
  }

  async linkDevice(deviceData: { deviceId: string; publicKey: string }): Promise<void> {
    if (this.linkedDevices.length >= (this.config.maxLinkedDevices || 5)) {
      throw new Error('Maximum number of linked devices reached')
    }

    this.linkedDevices.push({
      ...deviceData,
      lastSync: Date.now(),
      isActive: true
    })

    await this.saveState()
  }

  async syncDevices(): Promise<void> {
    const activeDevices = this.linkedDevices.filter(d => d.isActive)
    // Implement device sync logic here
    // This would typically involve encrypting and sharing session data
  }

  // Helper Methods
  private async verifySignatures(signatures: string[]): Promise<string[]> {
    const validSignatures: string[] = []
    
    for (const signature of signatures) {
      try {
        // Verify each signature against known public keys
        const isValid = await this.verifySignature(signature)
        if (isValid) {
          validSignatures.push(signature)
        }
      } catch (error) {
        console.error('Signature verification failed:', error)
      }
    }

    return validSignatures
  }

  private async verifySignature(signature: string): Promise<boolean> {
    // Implement signature verification logic
    // This would typically involve checking against stored public keys
    return true
  }
}

export const sessionRecoveryService = new SessionRecoveryService() 