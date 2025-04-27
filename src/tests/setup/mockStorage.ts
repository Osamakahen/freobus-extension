import { vi } from 'vitest'

const mockStore = new Map<string, any>()

export const mockStorage = {
  get: vi.fn((key: string) => Promise.resolve(mockStore.get(key))),
  set: vi.fn((key: string, value: any) => {
    mockStore.set(key, value)
    return Promise.resolve()
  }),
  remove: vi.fn((key: string) => {
    mockStore.delete(key)
    return Promise.resolve()
  }),
  clear: vi.fn(() => {
    mockStore.clear()
    return Promise.resolve()
  })
}

vi.mock('@plasmohq/storage', () => ({
  Storage: vi.fn().mockImplementation(() => mockStorage)
})) 