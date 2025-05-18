// Minimal AES-GCM encryption/decryption using Web Crypto API only

export async function encrypt(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const keyBytes = new TextEncoder().encode(key).slice(0, 32); // Use a 256-bit key

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    dataBytes
  );

  const result = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + result.length);
  combined.set(iv);
  combined.set(result, iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedData: string, key: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const keyBytes = new TextEncoder().encode(key).slice(0, 32);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  return new TextDecoder().decode(decrypted);
} 