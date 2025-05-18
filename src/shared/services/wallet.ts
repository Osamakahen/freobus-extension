import { Storage } from "@plasmohq/storage"
import type { Account, /* Network, */ StoredVault, WalletState } from "../types/wallet"
import networks from '../../../../shared/networks.json';

const storage = new Storage()
const TIMEOUT = 10000 // 10 seconds timeout
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Default networks
// const DEFAULT_NETWORKS: Network[] = [ ... ]; // Remove this

// DEV/TEST ONLY: Hardcoded test account for development
const TEST_ACCOUNT = {
  address: "0x976F10BB75DD48c889Bbb416595b1137b0793D91",
  name: "Test Account",
  index: 0,
  balances: {},
  privateKey: "0x7e5e5c6e2e7e2e5e5c6e2e7e2e5e5c6e2e7e2e5e5c6e2e7e2e5e5c6e2e7e2e"
};

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return array
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(str: string): Uint8Array {
  return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
}

export class WalletService {
  // private vault: StoredVault | null = null // Unused
  private state: WalletState = {
    isUnlocked: false,
    accounts: [],
    networks: networks,
    selectedNetwork: networks[0],
    selectedAccount: undefined,
    connectedSites: {}
  }
  public initPromise: Promise<void>
  // private password: string | null = null; // Unused

  constructor() {
    // Make initialization async
    this.initPromise = this.loadState()
  }

  private async loadState() {
    try {
      console.log('[WalletService] loadState called');
      const storedState = await Promise.race([
        storage.get("walletState"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Loading state timed out")), TIMEOUT)
        )
      ]) as string | undefined
      
      console.log('[WalletService] loaded walletState:', storedState);
      if (storedState) {
        this.state = JSON.parse(storedState)
      }
      // Also check for isUnlocked session flag
      const unlocked = await storage.get<boolean>("isUnlocked")
      console.log('[WalletService] loaded isUnlocked:', unlocked);
      if (typeof unlocked === 'boolean') {
        this.state.isUnlocked = unlocked
      }
      // Check for session timeout
      const lastUnlockedAt = await storage.get<number>("lastUnlockedAt")
      console.log('[WalletService] loaded lastUnlockedAt:', lastUnlockedAt);
      if (this.state.isUnlocked && lastUnlockedAt) {
        const now = Date.now()
        if (now - lastUnlockedAt > SESSION_TIMEOUT_MS) {
          this.state.isUnlocked = false
          await storage.set("isUnlocked", false)
        }
      }
    } catch (error) {
      console.error("Failed to load wallet state:", error)
      // Continue with default state
    }
  }

  private async saveState() {
    try {
      console.log('[WalletService] saveState called. Saving state:', this.state);
      await Promise.race([
        storage.set("walletState", JSON.stringify(this.state)),
        storage.set("isUnlocked", this.state.isUnlocked),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Saving state timed out")), TIMEOUT)
        )
      ])
      console.log('[WalletService] saveState complete.');
    } catch (error) {
      console.error("Failed to save wallet state:", error)
      throw new Error("Failed to save wallet state")
    }
  }

  // Add this method to expose the wallet state
  async getState(..._args: any[]): Promise<WalletState> {
    await this.initPromise
    return this.state
  }

  async saveUsername(..._args: any[]): Promise<void> {
    try {
      await Promise.race([
        storage.set("username", _args[0]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Saving username timed out")), TIMEOUT)
        )
      ])
    } catch (error) {
      console.error("Failed to save username:", error)
      throw new Error("Failed to save username")
    }
  }

  async setConnected(isConnected: boolean): Promise<void> {
    try {
      this.state.isUnlocked = isConnected
      if (isConnected) {
        await storage.set("lastUnlockedAt", Date.now())
      }
      await this.saveState()
    } catch (error) {
      console.error("Failed to set connection state:", error)
      throw new Error("Failed to set connection state")
    }
  }

  // Vault Management
  async hasWallet(..._args: any[]): Promise<boolean> {
    const storedVault = await storage.get<StoredVault>("vault");
    return !!storedVault;
  }

  async isInitialized(..._args: any[]): Promise<boolean> {
    const storedVault = await storage.get<StoredVault>("vault");
    return !!storedVault;
  }

  async resetWallet(..._args: any[]): Promise<void> {
    this.state.isUnlocked = false
    this.state.accounts = []
    this.state.selectedAccount = undefined
    await this.saveState()
    await storage.remove("vault")
    await storage.set("isUnlocked", false)
    await storage.remove("lastUnlockedAt")
  }

  // Stub methods for all wallet operations
  async createWallet(password: string, mnemonic?: string): Promise<void> {
    await this.initPromise
    // Use provided mnemonic or generate a new one
    const seed = mnemonic || crypto.randomUUID()
    const salt = generateRandomBytes(16)
    const iv = generateRandomBytes(12)
    const encryptedSeed = await this.encryptSeed(seed, password, salt, iv)
    const vault: StoredVault = {
      encryptedSeed,
      salt: toBase64(salt),
      iv: toBase64(iv),
      version: 1
    }
    await storage.set("vault", vault)
    // Always use TEST_ACCOUNT for demo/testing
    this.state.accounts = [TEST_ACCOUNT]
    this.state.selectedAccount = TEST_ACCOUNT
    this.state.isUnlocked = true
    await this.saveState()
  }

  async unlockWallet(password: string): Promise<boolean> {
    await this.initPromise
    const vault = await storage.get<StoredVault>("vault")
    if (!vault) return false
    const { encryptedSeed, salt, iv } = vault
    try {
      await this.decryptSeed(
        encryptedSeed,
        password,
        fromBase64(salt),
        fromBase64(iv)
      )
      // Always use TEST_ACCOUNT for demo/testing
      this.state.accounts = [TEST_ACCOUNT]
      this.state.selectedAccount = TEST_ACCOUNT
      this.state.isUnlocked = true
      await storage.set("lastUnlockedAt", Date.now())
      await this.saveState()
      return true
    } catch (e) {
      this.state.isUnlocked = false
      await this.saveState()
      return false
    }
  }

  async addAccount(..._args: any[]): Promise<Account> {
    console.log('[WalletService] Stub: addAccount called');
    return TEST_ACCOUNT;
  }

  async getAccounts(..._args: any[]): Promise<Account[]> {
    console.log('[WalletService] Stub: getAccounts called');
    return [TEST_ACCOUNT];
  }

  async setNetwork(..._args: any[]): Promise<void> {
    console.log('[WalletService] Stub: setNetwork called');
    return;
  }

  async addNetwork(/*network: Network*/): Promise<void> {
    console.log('[WalletService] Stub: addNetwork called');
    return;
  }

  async signTransaction(..._args: any[]): Promise<string> {
    console.log('[WalletService] Stub: signTransaction called');
    return "0xdeadbeef";
  }

  async connectSite(..._args: any[]): Promise<void> {
    console.log('[WalletService] Stub: connectSite called');
    return;
  }

  async disconnectSite(..._args: any[]): Promise<void> {
    console.log('[WalletService] Stub: disconnectSite called');
    return;
  }

  async shouldAutoConnect(..._args: any[]): Promise<boolean> {
    console.log('[WalletService] Stub: shouldAutoConnect called');
    return true;
  }

  async getSession(..._args: any[]): Promise<any> {
    console.log('[WalletService] Stub: getSession called');
    return {};
  }

  async updateNetwork(..._args: any[]): Promise<void> {
    console.log('[WalletService] Stub: updateNetwork called');
    return;
  }

  async signMessage(..._args: any[]): Promise<string> {
    console.log('[WalletService] Stub: signMessage called');
    return "0xdeadbeef";
  }

  async importAccountFromPrivateKey(..._args: any[]): Promise<Account> {
    console.log('[WalletService] Stub: importAccountFromPrivateKey called');
    return TEST_ACCOUNT;
  }

  // Encryption helpers
  private async encryptSeed(seed: string, password: string, salt: Uint8Array, iv: Uint8Array): Promise<string> {
    const key = await this.deriveKey(password, salt)
    const encoder = new TextEncoder()
    const seedData = encoder.encode(seed)
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      seedData
    )
    return Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async decryptSeed(encryptedSeed: string, password: string, salt: Uint8Array, iv: Uint8Array): Promise<void> {
    const key = await this.deriveKey(password, salt)
    const encryptedBytes = new Uint8Array(encryptedSeed.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedBytes
    )
    // Always use TEST_ACCOUNT for demo/testing
    this.state.accounts = [TEST_ACCOUNT]
    this.state.selectedAccount = TEST_ACCOUNT
    this.state.isUnlocked = true
    await storage.set("lastUnlockedAt", Date.now())
    await this.saveState()
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 310000,
        hash: "SHA-256"
      },
      key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    )
  }

  // Commented out unused private methods and parameters
  /*
  // @ts-ignore - Function may be used in future wallet recovery features
  private async decryptSeed(
    encryptedSeed: string,
    password: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    return '';
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    return {} as CryptoKey;
  }
  */
}

export const walletService = new WalletService()

// Commented out unused helper function
/*
function toHexChainId(chainId: string | number): string {
  if (typeof chainId === "number") return "0x" + chainId.toString(16);
  if (chainId.startsWith("0x")) return chainId.toLowerCase();
  return "0x" + parseInt(chainId, 10).toString(16);
} 
*/ 