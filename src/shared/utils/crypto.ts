import { ethers } from 'ethers'

export async function encrypt(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  const keyBytes = ethers.utils.arrayify(key)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    dataBytes
  )

  const result = new Uint8Array(encrypted)
  const combined = new Uint8Array(iv.length + result.length)
  combined.set(iv)
  combined.set(result, iv.length)

  return ethers.utils.hexlify(combined)
}

export async function decrypt(encryptedData: string, key: string): Promise<string> {
  const encryptedBytes = ethers.utils.arrayify(encryptedData)
  const keyBytes = ethers.utils.arrayify(key)

  const iv = encryptedBytes.slice(0, 12)
  const data = encryptedBytes.slice(12)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom()
  return {
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey
  }
}

export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey)
  return wallet.signMessage(message)
}

export async function verifySignature(message: string, signature: string, publicKey: string): Promise<boolean> {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)
    const wallet = new ethers.Wallet(publicKey)
    return recoveredAddress.toLowerCase() === wallet.address.toLowerCase()
  } catch (error) {
    return false
  }
} 