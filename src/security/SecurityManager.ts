import { SecureStorageManager } from './SecureStorageManager';
import { PermissionManager } from './PermissionManager';
import { EventEmitter } from 'events';
import { WalletService } from '../shared/services/wallet';
import { Transaction } from '../shared/types/wallet';

export class SecurityManager extends EventEmitter {
  private secureStorage: SecureStorageManager;
  private permissionManager: PermissionManager;
  private walletService: WalletService;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.secureStorage = new SecureStorageManager();
    this.permissionManager = new PermissionManager();
    this.walletService = new WalletService();
  }

  public async initialize(password: string): Promise<void> {
    try {
      await this.secureStorage.initialize(password);
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  public async storeData(key: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecurityManager not initialized');
    }
    await this.secureStorage.encrypt(key, data);
  }

  public async retrieveData(key: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('SecurityManager not initialized');
    }
    return await this.secureStorage.decrypt(key);
  }

  public grantPermission(origin: string, methods: string[], expiresIn?: number): void {
    this.permissionManager.grantPermission(origin, methods, expiresIn);
  }

  public revokePermission(origin: string): void {
    this.permissionManager.revokePermission(origin);
  }

  public hasPermission(origin: string, method: string): boolean {
    return this.permissionManager.hasPermission(origin, method);
  }

  public getPermissions(): any[] {
    return this.permissionManager.getPermissions();
  }

  public async clearStorage(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecurityManager not initialized');
    }
    await this.secureStorage.clear();
    this.permissionManager = new PermissionManager();
  }

  public getStorageSize(): number {
    return this.secureStorage.getStorageSize();
  }

  public getPermissionCount(): number {
    return this.permissionManager.getPermissionCount();
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  async signTransaction(tx: Transaction): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Security manager not initialized");
    }
    return this.walletService.signTransaction(tx);
  }
} 