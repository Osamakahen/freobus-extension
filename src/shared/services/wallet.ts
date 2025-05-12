import { ethers } from "ethers"
import { Storage } from "@plasmohq/storage"
import type { Account, Network, StoredVault, Transaction, WalletState } from "../types/wallet"
// Import shared networks config
const SHARED_NETWORKS: Network[] = require('../../../../shared/networks.json');

const storage = new Storage()
const TIMEOUT = 10000 // 10 seconds timeout

// Default networks
// const DEFAULT_NETWORKS: Network[] = [ ... ]; // Remove this

export class WalletService {
  private vault: StoredVault | null = null
  private state: WalletState = {
    isUnlocked: false,
    accounts: [],
    networks: SHARED_NETWORKS,
    selectedNetwork: SHARED_NETWORKS[0],
    connectedSites: {} as {
      [origin: string]: {
        chainId: string;
        accounts: string[];
        lastConnected: number;
        autoConnect: boolean;
        permissions: {
          eth_accounts: boolean;
          eth_chainId: boolean;
          personal_sign: boolean;
          eth_sendTransaction: boolean;
          wallet_switchEthereumChain: boolean;
        };
      };
    }
  }
  private initPromise: Promise<void>
  private pendingNetworkUpdate: NodeJS.Timeout | null = null
  private password: string | null = null

  constructor() {
    // Make initialization async
    this.initPromise = this.loadState()
  }

  // State Management
  private async loadState() {
    try {
      const storedState = await Promise.race([
        storage.get("walletState"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Loading state timed out")), TIMEOUT)
        )
      ]) as string | undefined
      
      if (storedState) {
        this.state = JSON.parse(storedState)
        // Normalize selectedNetwork.chainId to hex
        if (this.state.selectedNetwork && this.state.selectedNetwork.chainId) {
          const oldId = this.state.selectedNetwork.chainId;
          this.state.selectedNetwork.chainId = toHexChainId(this.state.selectedNetwork.chainId);
          console.log(`[loadState] Normalized selectedNetwork.chainId from ${oldId} to ${this.state.selectedNetwork.chainId}`);
        }
      }
    } catch (error) {
      console.error("Failed to load wallet state:", error)
      // Continue with default state
    }
  }

  private async saveState() {
    try {
      await Promise.race([
        storage.set("walletState", JSON.stringify(this.state)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Saving state timed out")), TIMEOUT)
        )
      ])
    } catch (error) {
      console.error("Failed to save wallet state:", error)
      throw new Error("Failed to save wallet state")
    }
  }

  // Add this method to expose the wallet state
  async getState(): Promise<WalletState> {
    await this.initPromise
    return this.state
  }

  async saveUsername(username: string): Promise<void> {
    try {
      await Promise.race([
        storage.set("username", username),
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
      await this.saveState()
    } catch (error) {
      console.error("Failed to set connection state:", error)
      throw new Error("Failed to set connection state")
    }
  }

  // Vault Management
  async hasWallet(): Promise<boolean> {
    const storedVault = await storage.get<StoredVault>("vault");
    return !!storedVault;
  }

  async isInitialized(): Promise<boolean> {
    const storedVault = await storage.get<StoredVault>("vault");
    return !!storedVault;
  }

  async resetWallet(): Promise<void> {
    await this.initPromise
    this.vault = null
    this.state.isUnlocked = false
    this.state.accounts = []
    this.state.selectedAccount = undefined
    await this.saveState()
    await storage.remove("vault")
  }

  async createWallet(password: string, force: boolean = false, mnemonic?: string): Promise<void> {
    await this.initPromise

    if (this.vault && !force) {
      throw new Error("Wallet already exists. Use force=true to overwrite existing wallet.")
    }

    try {
      console.log('Starting wallet creation...')
      // Use provided mnemonic or generate new wallet
      let wallet: ethers.Wallet
      if (mnemonic) {
        wallet = ethers.Wallet.fromMnemonic(mnemonic)
      } else {
        wallet = await Promise.race([
          ethers.Wallet.createRandom(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Wallet creation timed out")), TIMEOUT)
          )
        ]) as ethers.Wallet
      }

      if (!wallet.mnemonic?.phrase) {
        throw new Error("Failed to generate wallet mnemonic")
      }

      console.log('Generated new wallet')
      const salt = ethers.utils.randomBytes(32)
      const iv = ethers.utils.randomBytes(16)

      console.log('Encrypting seed phrase...')
      // Encrypt the seed phrase
      const encryptedSeed = await this.encryptSeed(wallet.mnemonic.phrase, password, salt, iv)
      console.log('Seed phrase encrypted')

      // Store the vault
      this.vault = {
        encryptedSeed,
        salt: ethers.utils.hexlify(salt),
        iv: ethers.utils.hexlify(iv),
        version: 1
      }

      // Store password temporarily for this session
      this.password = password

      console.log('Storing vault...')
      await storage.set("vault", this.vault)
      console.log('Vault stored')
      
      // Set wallet as unlocked and save state
      this.state.isUnlocked = true
      console.log('Saving state...')
      await this.saveState()
      console.log('State saved')
      
      // Wait for state to be fully saved
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log('Creating initial account...')
      // Create initial account
      await this.addAccount("Account 1")
      console.log('Initial account created')
    } catch (error) {
      // Reset state if anything fails
      this.vault = null
      this.password = null
      this.state.isUnlocked = false
      await this.saveState()
      console.error('Detailed wallet creation error:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to create wallet: ${error.message}`)
      } else {
        throw new Error('Failed to create wallet: Unknown error')
      }
    }
  }

  async unlockWallet(password: string): Promise<boolean> {
    const storedVault = await storage.get<StoredVault>("vault")
    if (!storedVault) {
      throw new Error("No wallet found")
    }

    try {
      // @ts-ignore - seed is used in decryptSeed function
      const seed = await this.decryptSeed(
        storedVault.encryptedSeed,
        password,
        ethers.utils.arrayify(storedVault.salt),
        ethers.utils.arrayify(storedVault.iv)
      )

      this.vault = storedVault
      this.state.isUnlocked = true
      await this.saveState()
      console.log('Wallet unlocked and state saved.')
      return true
    } catch (error) {
      console.error('Failed to save wallet state after unlock:', error)
      return false
    }
  }

  // Account Management
  async addAccount(name?: string): Promise<Account> {
    if (!this.vault || !this.state.isUnlocked) {
      throw new Error("Wallet is locked")
    }

    const index = this.state.accounts.length
    const path = `m/44'/60'/0'/0/${index}`
    const seed = await this.getSeed()
    const hdNode = ethers.utils.HDNode.fromMnemonic(seed).derivePath(path)
    const wallet = new ethers.Wallet(hdNode.privateKey)

    const account: Account = {
      address: wallet.address,
      name: name || `Account ${index + 1}`,
      index,
      balances: {},
      privateKey: wallet.privateKey // For development/testing only
    }

    this.state.accounts.push(account)
    if (!this.state.selectedAccount) {
      this.state.selectedAccount = account
    }

    await this.saveState()
    return account
  }

  async getAccounts(): Promise<Account[]> {
    return this.state.accounts
  }

  // Network Management
  async setNetwork(chainId: string): Promise<void> {
    console.log('[setNetwork] Received chainId:', chainId);
    try {
      // Always treat chainId as hex string for EIP-1193
      const normalizedChainId = (typeof chainId === 'string' && chainId.startsWith('0x'))
        ? chainId.toLowerCase()
        : '0x' + parseInt(chainId, 10).toString(16);
      console.log('[setNetwork] Normalized chainId:', normalizedChainId);
      const network = this.state.networks.find(n =>
        toHexChainId(n.chainId) === normalizedChainId
      );
      console.log('[setNetwork] Comparing against networks:', this.state.networks.map(n => n.chainId));
      if (!network) {
        const msg = `[setNetwork] Network not found for chainId: ${normalizedChainId}`;
        console.error(msg);
        throw new Error(msg);
      }
      // Create a provider for the target network (hex chainId)
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
      try {
        // Verify the network is accessible
        const networkInfo = await provider.getNetwork();
        console.log('[setNetwork] Provider network info:', networkInfo);
        if (
          toHexChainId(networkInfo.chainId) !== normalizedChainId
        ) {
          const msg = `[setNetwork] Network chainId mismatch: expected ${normalizedChainId}, got ${toHexChainId(networkInfo.chainId)}`;
          console.error(msg);
          throw new Error(msg);
        }
        // Update the state
        this.state.selectedNetwork = network;
        try {
          await this.saveState();
        } catch (e) {
          console.error('[setNetwork] Failed to save state:', e);
        }
        console.log('[setNetwork] Network switched to:', network);
        // If window.ethereum exists, try to update it as well
        if (window.ethereum) {
          const hexChainId = toHexChainId(network.chainId);
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: hexChainId }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: hexChainId,
                    chainName: network.name,
                    nativeCurrency: network.nativeCurrency,
                    rpcUrls: [network.rpcUrl],
                    blockExplorerUrls: network.blockExplorerUrls,
                    iconUrls: []
                  }],
                });
              } catch (addError) {
                const msg = `[setNetwork] Failed to add network to window.ethereum: ${addError}`;
                console.error(msg);
                throw new Error(msg);
              }
            } else {
              const msg = `[setNetwork] Failed to update window.ethereum network: ${switchError && switchError.message ? switchError.message : switchError}`;
              console.error(msg);
              throw new Error(msg);
            }
          }
        }
      } catch (e) {
        console.error('[setNetwork] Provider/network error:', e);
        throw e;
      }
    } catch (err) {
      console.error('[setNetwork] Error:', err);
      throw err;
    }
  }

  async addNetwork(network: Network): Promise<void> {
    if (this.state.networks.some(n => n.chainId === network.chainId)) {
      throw new Error("Network already exists")
    }

    this.state.networks.push(network)
    await this.saveState()
  }

  // Transaction Signing
  async signTransaction(tx: Transaction): Promise<string> {
    if (!this.vault || !this.state.isUnlocked) {
      throw new Error("Wallet is locked")
    }

    const seed = await this.getSeed()
    const account = this.state.accounts.find(a => a.address.toLowerCase() === tx.from.toLowerCase())
    if (!account) {
      throw new Error("Account not found")
    }

    const path = `m/44'/60'/0'/0/${account.index}`
    const hdNode = ethers.utils.HDNode.fromMnemonic(seed).derivePath(path)
    const wallet = new ethers.Wallet(hdNode.privateKey)

    const provider = new ethers.providers.JsonRpcProvider(this.state.selectedNetwork.rpcUrl)
    const connectedWallet = wallet.connect(provider)

    const signedTx = await connectedWallet.signTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      chainId: parseInt(tx.chainId)
    })

    return signedTx
  }

  // Site Connection Management
  async connectSite(origin: string, accounts: string[], permissions: string[]): Promise<void> {
    const permissionMap: Record<string, boolean> = {
      eth_accounts: false,
      eth_chainId: false,
      personal_sign: false,
      eth_sendTransaction: false,
      wallet_switchEthereumChain: false
    }

    permissions.forEach(permission => {
      if (permission in permissionMap) {
        permissionMap[permission] = true
      }
    })

    this.state.connectedSites[origin] = {
      chainId: this.state.selectedNetwork.chainId,
      accounts,
      lastConnected: Date.now(),
      autoConnect: true,
      permissions: permissionMap as WalletState['connectedSites'][string]['permissions']
    }
    await this.saveState()
  }

  async disconnectSite(origin: string): Promise<void> {
    delete this.state.connectedSites[origin]
    await this.saveState()
  }

  async shouldAutoConnect(origin: string): Promise<boolean> {
    const session = this.state.connectedSites[origin]
    if (!session || !session.autoConnect) return false
    
    // 24 hour timeout
    const sessionAge = Date.now() - session.lastConnected
    if (sessionAge > 24 * 60 * 60 * 1000) return false
    
    return true
  }

  async getSession(origin: string) {
    return this.state.connectedSites[origin]
  }

  async updateNetwork(origin: string, chainId: string): Promise<void> {
    console.log('[updateNetwork] origin:', origin, 'chainId:', chainId);
    if (this.pendingNetworkUpdate) {
      clearTimeout(this.pendingNetworkUpdate)
    }
    this.pendingNetworkUpdate = setTimeout(async () => {
      try {
        await this.setNetwork(chainId)
        if (this.state.connectedSites[origin]) {
          this.state.connectedSites[origin].chainId = chainId
          await this.saveState()
        }
        console.log('[updateNetwork] Network updated for origin:', origin);
      } catch (e) {
        console.error('[updateNetwork] Error updating network:', e);
      }
    }, 500)
  }

  // Private Helper Methods
  private async encryptSeed(
    seed: string,
    password: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    const key = await this.deriveKey(password, salt)
    const encoder = new TextEncoder()
    const seedData = encoder.encode(seed)

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      seedData
    )

    return ethers.utils.hexlify(new Uint8Array(encrypted))
  }

  private async decryptSeed(
    encryptedSeed: string,
    password: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    const key = await this.deriveKey(password, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ethers.utils.arrayify(encryptedSeed)
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
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

  private async getSeed(): Promise<string> {
    if (!this.vault || !this.state.isUnlocked || !this.password) {
      throw new Error("Wallet is locked")
    }

    try {
      return await this.decryptSeed(
        this.vault.encryptedSeed,
        this.password,
        ethers.utils.arrayify(this.vault.salt),
        ethers.utils.arrayify(this.vault.iv)
      )
    } catch (error) {
      console.error('Failed to decrypt seed:', error)
      throw new Error('Failed to decrypt wallet seed')
    }
  }

  async signMessage(message: string, address: string): Promise<string> {
    if (!this.vault || !this.state.isUnlocked) {
      throw new Error("Wallet is locked")
    }

    const seed = await this.getSeed()
    const account = this.state.accounts.find(a => a.address.toLowerCase() === address.toLowerCase())
    if (!account) {
      throw new Error("Account not found")
    }

    const path = `m/44'/60'/0'/0/${account.index}`
    const hdNode = ethers.utils.HDNode.fromMnemonic(seed).derivePath(path)
    const wallet = new ethers.Wallet(hdNode.privateKey)

    const signature = await wallet.signMessage(message)
    return signature
  }

  async importAccountFromPrivateKey(privateKey: string, name?: string): Promise<Account> {
    if (!this.vault || !this.state.isUnlocked) {
      throw new Error("Wallet is locked")
    }
    const wallet = new ethers.Wallet(privateKey)
    const account: Account = {
      address: wallet.address,
      name: name || `Imported Account ${this.state.accounts.length + 1}`,
      index: this.state.accounts.length,
      balances: {},
      privateKey: wallet.privateKey // For development/testing only
    }
    this.state.accounts.push(account)
    await this.saveState()
    return account
  }
}

export const walletService = new WalletService()

function toHexChainId(chainId: string | number): string {
  if (typeof chainId === "number") return "0x" + chainId.toString(16);
  if (chainId.startsWith("0x")) return chainId.toLowerCase();
  return "0x" + parseInt(chainId, 10).toString(16);
} 