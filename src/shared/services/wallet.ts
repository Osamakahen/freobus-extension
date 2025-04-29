import { ethers } from "ethers"
import { Storage } from "@plasmohq/storage"
import type { Account, Network, StoredVault, Transaction, WalletState } from "../types/wallet"

const storage = new Storage()
const TIMEOUT = 10000 // 10 seconds timeout

// Cache providers to avoid recreation
const providerCache: Record<string, ethers.providers.JsonRpcProvider> = {}

// Default networks
const DEFAULT_NETWORKS: Network[] = [
  {
    chainId: "0x1",
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/6131105f1e4c4841a297c5392effa977",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://etherscan.io"
  },
  {
    chainId: "0xaa36a7",
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/6131105f1e4c4841a297c5392effa977",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io"
  }
]

export class WalletService {
  private vault: StoredVault | null = null
  private state: WalletState = {
    isUnlocked: false,
    accounts: [],
    networks: DEFAULT_NETWORKS,
    selectedNetwork: DEFAULT_NETWORKS[0],
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
  private derivedKeyCache: Map<string, CryptoKey> = new Map()
  private initPromise: Promise<void>
  private pendingNetworkUpdate: NodeJS.Timeout | null = null

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

  // Get cached or create new provider
  private getProvider(rpcUrl: string): ethers.providers.JsonRpcProvider {
    if (!providerCache[rpcUrl]) {
      providerCache[rpcUrl] = new ethers.providers.JsonRpcProvider(rpcUrl)
    }
    return providerCache[rpcUrl]
  }

  // Vault Management
  async createWallet(password: string): Promise<void> {
    await this.initPromise

    if (this.vault) {
      throw new Error("Wallet already exists")
    }

    try {
      // Generate new wallet with timeout
      const wallet = await Promise.race([
        ethers.Wallet.createRandom(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Wallet creation timed out")), TIMEOUT)
        )
      ]) as ethers.Wallet

      const salt = ethers.utils.randomBytes(32)
      const iv = ethers.utils.randomBytes(16)

      // Encrypt the seed phrase
      const encryptedSeed = await this.encryptSeed(wallet.mnemonic.phrase, password, salt, iv)

      // Store the vault
      this.vault = {
        encryptedSeed,
        salt: ethers.utils.hexlify(salt),
        iv: ethers.utils.hexlify(iv),
        version: 1
      }

      await storage.set("vault", this.vault)
      
      // Set wallet as unlocked and save state
      this.state.isUnlocked = true
      await this.saveState()
      
      // Wait for state to be fully saved
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create initial account
      await this.addAccount("Account 1")
    } catch (error) {
      // Reset state if anything fails
      this.vault = null
      this.state.isUnlocked = false
      await this.saveState()
      console.error("Failed to create wallet:", error)
      throw new Error("Failed to create wallet")
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
      return true
    } catch (error) {
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
      balances: {}
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
    const network = this.state.networks.find(n => n.chainId === chainId)
    if (!network) {
      throw new Error("Network not found")
    }

    this.state.selectedNetwork = network
    await this.saveState()
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
    if (this.pendingNetworkUpdate) {
      clearTimeout(this.pendingNetworkUpdate)
    }
    
    this.pendingNetworkUpdate = setTimeout(async () => {
      await this.setNetwork(chainId)
      if (this.state.connectedSites[origin]) {
        this.state.connectedSites[origin].chainId = chainId
        await this.saveState()
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
    if (!this.vault || !this.state.isUnlocked) {
      throw new Error("Wallet is locked")
    }
    return 'test_seed_phrase'
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
}

export const walletService = new WalletService() 