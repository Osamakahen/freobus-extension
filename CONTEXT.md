# FreoBus & FreoWallet: Context, Achievements, Extension Roadmap, and Code Sharing Strategy

## 1. Project Background: FreoBus & FreoWallet

### What We Built So Far
- FreoBus is a next-generation Web3 platform and dApp aggregator, designed to provide a seamless, frictionless experience for users exploring and interacting with decentralized applications (dApps).
- FreoWallet is the integrated wallet solution within FreoBus, enabling users to manage assets, connect to dApps, and perform transactions directly from the web platform.

### Key Features Implemented
- **Marketplace Aggregator:**
  - Users can browse, search, and discover a curated list of dApps (e.g., Uniswap, OpenSea).
- **In-App dApp Integrations:**
  - Native Uniswap swap UI (ETH/USDC demo).
  - Native OpenSea NFT explorer (fetch and display trending NFTs).
- **Wallet Connection & Management:**
  - Users can create or connect a wallet, view balances, and simulate transactions.
- **Onboarding & Dashboard:**
  - Hero section, onboarding CTA, wallet status, and "Explore dApps" prompt.
- **Session Management (Web):**
  - Auto-connect and "remember me" for in-app dApps.
- **Modern, Responsive UI:**
  - Built with Next.js, React, and Tailwind CSS.

## 2. Why a Browser Extension?

### Limitations of Web-Only Approach
- External dApps (like OpenSea) cannot be embedded due to security headers (CSP, X-Frame-Options).
- Session persistence and seamless wallet experience are limited to the FreoBus platform; users must reconnect or switch networks when visiting external dApps.

### Vision for the Extension
- Deliver a "MetaMask-level" (or better) experience:
  - Persistent, secure wallet connection across all dApps, both in-app and external.
  - "Connect once, use everywhere"—no more popups, network mismatches, or lost sessions.
- Enable advanced session management:
  - Per-origin permissions, auto-connect, network auto-switch, and session timeouts.
- Unify the wallet experience:
  - Users see the same wallet, assets, and permissions whether on FreoBus or any dApp in the ecosystem.

## 3. Objectives of the New Project: freobus-extension

### Primary Goals
- Build a browser extension wallet (FreoWallet) that injects an EIP-1193 provider (window.ethereum) into every dApp page.
- Implement robust session management:
  - Remember which dApps the user has connected to, what permissions were granted, and on which network.
  - Auto-connect and auto-switch network as needed.
- Ensure security and user control:
  - Origin-based permissions, granular access control, session timeouts, and secure signing popups.
- Seamless integration with FreoBus web platform:
  - Users can connect their wallet once and use it everywhere—on FreoBus and any dApp.

### Expected Outcomes
- Persistent, seamless wallet experience across all dApps (internal and external).
- Advanced session and permission management for security and user control.
- Unified wallet state between the extension and the FreoBus web platform.
- Foundation for future features:
  - Composable workflows, analytics, developer tools, and community integration.

## 4. Technical Approach

### Project Structure
- Separate repository/project:
  - freobus-extension (or similar).
- Tech stack:
  - React (for popup UI), TypeScript, Plasmo or Vite + CRXJS for extension scaffolding.
- Core components:
  - Background script: Orchestrates session state, handles requests, manages connections.
  - Content script: Injects provider, bridges dApp and background.
  - Popup UI: Main wallet interface (account, network, assets, permissions).
  - Provider: EIP-1193-compliant, injected as window.ethereum.

### Key Features to Implement
- Account management: Create/import/export wallets, show addresses.
- Network support: Ethereum mainnet/testnets, EVM-compatible chains.
- Transaction signing: Secure, contextual popups for user approval.
- Session management:
  - Store sessions per dApp origin.
  - Auto-connect, permission granularity, session timeouts.
- Security:
  - Encrypt private keys, lock wallet after inactivity, origin validation.
- User experience:
  - Onboarding, notifications, accessibility, responsive UI.

### Integration with FreoBus
- Shared wallet logic:
  - If needed, extract wallet/account logic into a shared package for use in both web and extension.
- Unified session state:
  - Extension manages wallet state; web platform detects and uses the injected provider.
- Consistent UX:
  - Users see the same wallet, assets, and permissions on both platforms.

## 5. Referencing the Current Repository & Code Sharing

### Why Reference the Current Repo?
- Consistency: Ensures wallet/account logic, transaction handling, and UI/UX are consistent across web and extension.
- Efficiency: Avoids duplicating complex logic (e.g., cryptography, EVM provider, types).
- Maintainability: Updates and bug fixes can be shared between projects.

### What to Reference or Share?
Best candidates for sharing:
- Wallet/account logic:
  - Key generation, encryption, mnemonic handling, account import/export.
- EVM provider logic:
  - Wrappers for ethers.js/viem, transaction building, signing, and sending.
- TypeScript types:
  - Transaction types, account types, network types, etc.
- Validation and utility functions:
  - Address validation, formatting, etc.
- UI components (optional):
  - If you want a consistent look, share React components or design system.

### How to Structure a Shared Package
**Option 1: Manual Reference**
- Copy relevant code from the web repo to the extension repo as needed.
- Good for MVP, but can lead to code drift.

**Option 2: Shared NPM Package (Recommended for Scale)**
- Extract shared logic into a package (e.g., @freobus/wallet-core).
- Publish privately (GitHub Packages, npm private registry) or locally (via monorepo).
- Both the web app and extension import from this package.

**Option 3: Monorepo (Advanced)**
- Use a monorepo tool (Yarn workspaces, Nx, Turborepo).
- Structure:
```
/packages/web         # Your Next.js app
/packages/extension   # The browser extension
/packages/shared      # Shared wallet logic, types, utils
```
- Both projects import from /packages/shared.

**Best Practice:** Start with manual reference for rapid prototyping. As the codebase grows, migrate shared logic to a package or monorepo for maintainability.

## 6. How the Extension Will Be Built Into FreoBus

### Integration Plan
1. Build and test the extension independently.
2. Ensure the extension injects a provider that is detected by the FreoBus web platform and all dApps.
3. Update the FreoBus web platform to prefer the extension's provider if present.
4. (Optional) Share wallet/account logic via a shared package for consistency.
5. Document the integration process and provide onboarding for users to install the extension.

### User Journey
1. User lands on FreoBus aggregator.
2. Creates or connects their FreoWallet (extension or web).
3. Browses and interacts with dApps in-app (Uniswap, NFT explorer, etc.).
4. Clicks into an external dApp (like OpenSea)—wallet is already connected, session is remembered, network is correct.
5. Returns to FreoBus or any other dApp—wallet is still connected, no friction.
6. All sessions, permissions, and networks are managed automatically and securely.

## 7. Summary Table

| Feature/Goal | Web Platform (Current) | Extension (Planned) |
|-------------|------------------------|-------------------|
| In-app dApp integration | ✅ | ✅ |
| External dApp connection | ❌ | ✅ |
| Persistent sessions | Limited | Advanced |
| Permission management | Basic | Granular |
| Auto-connect/network switch | ❌ | ✅ |
| Secure signing popups | Basic | Advanced |
| Unified wallet experience | Partial | Full |
| Shared wallet logic | N/A | Via package |

## 8. Next Steps
1. Scaffold the freobus-extension project using Plasmo or Vite + CRXJS.
2. Implement core extension architecture: background, content, provider, popup UI.
3. Develop session management and security features.
4. Test integration with FreoBus web platform and external dApps.
5. (Optional) Extract and share wallet logic/types as a package.
6. Document and prepare for user onboarding and launch.

## Appendix: Useful References
- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [Plasmo Extension Framework](https://docs.plasmo.com/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- [MetaMask Extension Architecture](https://docs.metamask.io/guide/create-dapp.html)
- [Rabby Wallet Architecture](https://rabby.io/) 