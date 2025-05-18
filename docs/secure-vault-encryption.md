# 🔐 Secure Vault Encryption & Unlock – Documentation

## Overview
This logic ensures that a user's wallet seed phrase (mnemonic) is **never stored in plaintext**. Instead, it is encrypted with the user's password using strong cryptography, and only the encrypted vault is stored in browser storage. The password is required to decrypt and unlock the wallet.

---

## How It Works

### 1. Wallet Creation (`create_wallet` action)
- **Input:**  
  - `mnemonic` (the generated seed phrase)
  - `password` (user-chosen password)
- **Process:**
  1. **Generate a random salt** (16 bytes) and IV (12 bytes).
  2. **Derive a key** from the password and salt using PBKDF2 (310,000 iterations, SHA-256).
  3. **Encrypt the mnemonic** using AES-GCM with the derived key and IV.
  4. **Store** `{ encrypted, salt, iv }` as the `vault` in `chrome.storage.local`.
  5. The wallet state (address, etc.) is also stored, but the mnemonic is never stored in plaintext.
- **Security:**  
  - The password is never stored or transmitted.
  - The seed phrase is only ever stored encrypted.

### 2. Wallet Unlock (`unlock_wallet` action)
- **Input:**  
  - `password` (entered by the user)
- **Process:**
  1. **Retrieve** the encrypted vault `{ encrypted, salt, iv }` from storage.
  2. **Derive the key** from the entered password and stored salt.
  3. **Attempt to decrypt** the vault using AES-GCM and the derived key.
  4. If decryption is successful, the mnemonic is recovered and the wallet is restored.
  5. If decryption fails, an error is returned (e.g., "Incorrect password").
- **Security:**  
  - Only the correct password can decrypt the vault.
  - After 3 failed attempts, the UI prompts the user to restore with their seed phrase.

### 3. Restore Flow
- If the user forgets their password, they can restore the wallet using their seed phrase and set a new password, which will re-encrypt and store a new vault.

---

## Technical Details

- **Encryption:** AES-GCM (256-bit)
- **Key Derivation:** PBKDF2 (310,000 iterations, SHA-256)
- **Salt:** 16 random bytes (base64 encoded)
- **IV:** 12 random bytes (base64 encoded)
- **Vault Storage:**  
  ```json
  {
    "vault": {
      "encrypted": "<base64>",
      "salt": "<base64>",
      "iv": "<base64>"
    }
  }
  ```
- **No plaintext password or mnemonic is ever stored.**

---

## Why This Is Secure
- Even if browser storage is compromised, the attacker cannot decrypt the vault without the password.
- The password is never stored or sent anywhere.
- The user can always recover their wallet with the seed phrase.

---

## How to Use in Code
- **To create a wallet:**  
  Send `{ action: 'create_wallet', mnemonic, password }` to the background script.
- **To unlock a wallet:**  
  Send `{ action: 'unlock_wallet', password }` to the background script.

---

**This approach matches the security model of industry leaders like MetaMask and Trust Wallet.** 