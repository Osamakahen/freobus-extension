import { EventEmitter } from 'events';

interface Permission {
  origin: string;
  methods: string[];
  timestamp: number;
  expiresAt?: number;
}

export class PermissionManager extends EventEmitter {
  private permissions: Map<string, Permission> = new Map();
  private static readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super();
  }

  public grantPermission(origin: string, methods: string[], expiresIn?: number): void {
    const permission: Permission = {
      origin,
      methods,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : Date.now() + PermissionManager.DEFAULT_EXPIRY
    };

    this.permissions.set(origin, permission);
    this.emit('permissionGranted', { origin, methods });
  }

  public revokePermission(origin: string): void {
    if (this.permissions.delete(origin)) {
      this.emit('permissionRevoked', { origin });
    }
  }

  public hasPermission(origin: string, method: string): boolean {
    const permission = this.permissions.get(origin);
    if (!permission) return false;

    if (permission.expiresAt && Date.now() > permission.expiresAt) {
      this.revokePermission(origin);
      return false;
    }

    return permission.methods.includes(method);
  }

  public getPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  public clearExpiredPermissions(): void {
    const now = Date.now();
    for (const [origin, permission] of this.permissions.entries()) {
      if (permission.expiresAt && now > permission.expiresAt) {
        this.revokePermission(origin);
      }
    }
  }

  public getPermissionCount(): number {
    return this.permissions.size;
  }
} 