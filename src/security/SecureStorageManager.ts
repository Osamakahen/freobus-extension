import { EventEmitter } from 'events';
import { utils } from 'ethers';

interface EncryptedData {
  iv: Uint8Array;
  encryptedData: Uint8Array;
  timestamp: number;
}

export class SecureStorageManager extends EventEmitter {
  private encryptionKey: CryptoKey | null = null;
  private storage: Map<string, EncryptedData> = new Map();
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  constructor() {
    super();
  }

  public async initialize(password: string): Promise<void> {
    try {
      const keyMaterial = await this.deriveKeyMaterial(password);
      this.encryptionKey = await this.deriveKey(keyMaterial);
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async deriveKeyMaterial(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return keyMaterial;
  }

  private async deriveKey(keyMaterial: CryptoKey): Promise<CryptoKey> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: SecureStorageManager.ALGORITHM, length: SecureStorageManager.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public async encrypt(key: string, data: any): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Storage manager not initialized');
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: SecureStorageManager.ALGORITHM,
          iv
        },
        this.encryptionKey,
        encodedData
      );

      this.storage.set(key, {
        iv,
        encryptedData: new Uint8Array(encryptedData),
        timestamp: Date.now()
      });

      this.emit('dataEncrypted', { key });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async decrypt(key: string): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Storage manager not initialized');
    }

    const encryptedData = this.storage.get(key);
    if (!encryptedData) {
      return null;
    }

    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: SecureStorageManager.ALGORITHM,
          iv: encryptedData.iv
        },
        this.encryptionKey,
        encryptedData.encryptedData
      );

      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(decryptedData));

      this.emit('dataDecrypted', { key });
      return data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    this.storage.clear();
    this.encryptionKey = null;
    this.emit('cleared');
  }

  public getStorageSize(): number {
    return this.storage.size;
  }

  public getKeys(): string[] {
    return Array.from(this.storage.keys());
  }
} 