# FreoWallet: Onboarding, Account Settings, and Recovery

## 1. Onboarding

### 1.1. Welcome Screen
- **Purpose:** Introduces new users to FreoWallet and provides options to create a new wallet or restore an existing one.
- **Features:**
  - Brief description of FreoWallet's capabilities and security.
  - "Get Started" button for new users.
  - "Restore Wallet" option for users with an existing seed phrase.

### 1.2. Creating a New Wallet
- **Password Creation:**
  - Users are prompted to create a strong password (minimum 8 characters).
  - Password confirmation is required to prevent typos.
  - The password is used to encrypt the wallet locally and is never transmitted or stored externally.
- **Seed Phrase Generation:**
  - After password setup, a 12-word BIP-39 mnemonic (seed phrase) is generated using secure cryptographic methods.
  - The seed phrase is displayed to the user with clear instructions to write it down and store it securely.
  - **Backup Modal:** A modal dialog emphasizes the importance of the seed phrase, warning that loss of the phrase means loss of access to funds.
- **Seed Phrase Confirmation:**
  - (Optional, but recommended) Users may be asked to confirm selected words from the seed phrase to ensure they have backed it up correctly.
- **Wallet Initialization:**
  - Once the seed phrase is confirmed and backed up, the wallet is initialized and the user is taken to the main wallet interface.

### 1.3. Security Warnings
- **Persistent Banner:** If the user has not marked the seed phrase as backed up, a persistent warning banner is shown in the wallet interface.
- **Modal Warnings:** Before any action that could result in data loss (e.g., extension removal, reset), users are warned that without a backup, their funds will be lost.

---

## 2. Account Settings

### 2.1. Account Overview
- **Account List:** Users can view all accounts derived from their seed phrase.
- **Account Details:** Each account displays its address, balance, and a user-friendly name (if set).

### 2.2. Network Management
- **Multi-Chain Support:** Users can switch between supported networks (e.g., Ethereum, Optimism) via a network selector.
- **Custom Networks:** (If supported) Users can add or remove custom EVM-compatible networks.

### 2.3. Security & Privacy
- **Password Management:** Users can change their wallet password (requires current password for confirmation).
- **Lock Wallet:** Users can manually lock the wallet, requiring the password to unlock.
- **Session Management:** The wallet can automatically lock after a period of inactivity.

### 2.4. Export & Backup
- **Export Private Key:** Users can export the private key for any account after entering their password and confirming warnings about security risks.
- **Export Seed Phrase:** Users can view/export their seed phrase after password confirmation, with strong warnings about keeping it private.

### 2.5. Legacy Account Migration
- **Detection:** If a user's account was created before seed phrase support, a "Legacy Wallet" warning is shown.
- **Migration Flow:** Users are guided to migrate their legacy account to a seed phrase-based wallet, or export their private key for manual backup.

---

## 3. Recovery

### 3.1. Restoring a Wallet
- **Restore Option:** On the welcome screen, users can choose to restore a wallet using their 12-word seed phrase.
- **Password Setup:** Users set a new password for the restored wallet.
- **Account Derivation:** All accounts previously generated from the seed phrase are restored automatically.

### 3.2. Recovery Warnings
- **Seed Phrase Only:** The seed phrase is the only way to recover a wallet. If lost, funds are irretrievable.
- **No Cloud Backup:** FreoWallet does not store or transmit seed phrases or private keys to any server.

### 3.3. Recovery for Legacy Accounts
- **Manual Export:** Users with legacy (local-only) accounts are prompted to export their private key and import it into a new, seed phrase-based wallet.
- **Migration Wizard:** A step-by-step wizard helps users back up, migrate, and verify their new wallet.

---

## 4. User Experience & Best Practices

- **Clear Instructions:** All onboarding and recovery steps provide clear, non-technical explanations and warnings.
- **Accessible UI:** All warnings, modals, and banners are visually distinct and accessible.
- **Security First:** Users are repeatedly reminded that they are responsible for their own backups.
- **No Recovery Without Backup:** If the extension is removed or reset and the user has not backed up their seed phrase or private key, their funds are permanently lost.

---

## 5. Summary Table

| Feature                | Description                                                                                  |
|------------------------|----------------------------------------------------------------------------------------------|
| Onboarding             | Password creation, seed phrase generation, backup modal, confirmation, security warnings     |
| Account Settings       | Account list, network management, password/security, export options, legacy migration        |
| Recovery               | Restore from seed phrase, password reset, legacy account migration, persistent warnings      |
| Security               | No cloud backup, local encryption, user responsibility for backup, strong warnings           |

---

**FreoWallet** is designed to empower users with full control and responsibility over their crypto assets, following industry best practices for security and usability. 