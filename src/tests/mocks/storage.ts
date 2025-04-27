export class MockStorage {
  private store: Map<string, any> = new Map()

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key)
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }
} 