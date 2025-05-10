import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Account, Network } from '../shared/types/wallet'
import { walletService } from '../shared/services/wallet'
import './style.css'
import Welcome from './components/Welcome'
import CreateWallet from './components/CreateWallet'
import WalletContent from './components/WalletContent'
import { NetworkStateManager } from '../network/NetworkStateManager'
import RestoreWallet from './components/RestoreWallet'
import { ethers } from 'ethers'
import SeedPhraseBackupModal from './components/SeedPhraseBackupModal'
import MigrationWizard from './components/MigrationWizard'

interface WalletState {
  isUnlocked: boolean
  selectedAccount?: Account
  selectedNetwork?: Network
  networks: Network[]
}

const App: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [showWelcome, setShowWelcome] = useState<boolean>(true)
  const [hasWallet, setHasWallet] = useState<boolean>(false)
  const [mevProtection, setMevProtection] = useState<any>(null)
  const [showRestore, setShowRestore] = useState<boolean>(false)
  const [isRestoring, setIsRestoring] = useState<boolean>(false)
  const [showLegacyModal, setShowLegacyModal] = useState(false)
  const [isLegacy, setIsLegacy] = useState(false)
  const [showMigrationBackupModal, setShowMigrationBackupModal] = useState(false)
  const [migrationMnemonic, setMigrationMnemonic] = useState<string | null>(null)
  const [showMigrationWizard, setShowMigrationWizard] = useState(false)
  const [legacyAccount, setLegacyAccount] = useState<any>(null)

  const networkStateManager = new NetworkStateManager();

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if wallet exists
        const walletExists = await walletService.hasWallet()
        setHasWallet(walletExists)
        
        // If no wallet exists, show welcome screen
        if (!walletExists) {
          setShowWelcome(true)
          setIsLoading(false)
          return
        }

        // If wallet exists, load state
        const state = await walletService.getState() as WalletState
        setIsUnlocked(state.isUnlocked)
        if (state.isUnlocked && state.selectedAccount && state.selectedNetwork) {
          setShowWelcome(false)
          setSelectedAccount(state.selectedAccount)
          setSelectedNetwork(state.selectedNetwork)
          setNetworks(state.networks)
          // Fetch MEV protection for the selected network
          const ns = await networkStateManager.initializeNetworkState(state.selectedNetwork.chainId)
          setMevProtection(ns.mevProtection)
          const fullState = await walletService.getState();
          if (fullState.accounts && fullState.accounts.length > 0 && !await walletService.hasWallet()) {
            setIsLegacy(true)
            setShowLegacyModal(true)
          }
        }
      } catch (err) {
        console.error('Error initializing wallet:', err)
        setError('Failed to initialize wallet')
      } finally {
        setIsLoading(false)
      }
    }

    initializeWallet()
  }, [])

  const handleCreateWallet = async (password: string, mnemonic?: string) => {
    setIsCreating(true)
    setError('')
    try {
      console.log('Creating wallet...')
      await walletService.createWallet(password, false, mnemonic)
      console.log('Wallet created successfully')
      const state = await walletService.getState() as WalletState
      setIsUnlocked(state.isUnlocked)
      setHasWallet(true)
      if (state.selectedAccount && state.selectedNetwork) {
        setSelectedAccount(state.selectedAccount)
        setSelectedNetwork(state.selectedNetwork)
        setNetworks(state.networks)
        // Fetch MEV protection for the selected network
        const ns = await networkStateManager.initializeNetworkState(state.selectedNetwork.chainId)
        setMevProtection(ns.mevProtection)
      }
      setShowWelcome(false)
    } catch (err) {
      console.error('Error creating wallet:', err)
      setError('Failed to create wallet. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleGetStarted = () => {
    setShowWelcome(false)
  }

  const handleSwitchNetwork = async (chainId: string) => {
    try {
      setError('')
      await walletService.setNetwork(chainId)
      const state = await walletService.getState()
      setSelectedNetwork(state.selectedNetwork)
      // Fetch MEV protection for the new network
      const ns = await networkStateManager.initializeNetworkState(chainId)
      setMevProtection(ns.mevProtection)
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError('Failed to switch network. Please try again.')
    }
  }

  const handleRestoreWallet = async (password: string, mnemonic: string) => {
    setIsRestoring(true)
    setError('')
    try {
      await walletService.createWallet(password, true, mnemonic)
      const state = await walletService.getState() as WalletState
      setIsUnlocked(state.isUnlocked)
      setHasWallet(true)
      if (state.selectedAccount && state.selectedNetwork) {
        setSelectedAccount(state.selectedAccount)
        setSelectedNetwork(state.selectedNetwork)
        setNetworks(state.networks)
        const ns = await networkStateManager.initializeNetworkState(state.selectedNetwork.chainId)
        setMevProtection(ns.mevProtection)
      }
      setShowRestore(false)
      setShowWelcome(false)
    } catch (err) {
      console.error('Error restoring wallet:', err)
      setError('Failed to restore wallet. Please check your seed phrase and try again.')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleMigrateLegacy = async () => {
    // 1. Generate new seed phrase
    const wallet = await ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic.phrase;
    setMigrationMnemonic(mnemonic);
    setShowMigrationBackupModal(true);
  }

  const handleExportLegacy = () => {
    setShowLegacyModal(false);
    // Open export private key modal in WalletContent (already implemented)
    // Optionally, set a state to trigger export modal
  }

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      {error && <div className="error-message">{error}</div>}
      
      {showWelcome ? (
        <Welcome onGetStarted={handleGetStarted} onRestore={() => setShowRestore(true)} />
      ) : showRestore ? (
        <RestoreWallet
          onRestoreWallet={handleRestoreWallet}
          isRestoring={isRestoring}
          setIsRestoring={setIsRestoring}
          error={error}
        />
      ) : !hasWallet ? (
        <CreateWallet 
          onCreateWallet={handleCreateWallet} 
          isCreating={isCreating} 
          setIsCreating={setIsCreating}
          error={error}
        />
      ) : !isUnlocked ? (
        <div>Unlock your wallet</div> // TODO: Add UnlockWallet component
      ) : (
        <>
          <WalletContent
            selectedAccount={selectedAccount}
            selectedNetwork={selectedNetwork}
            networks={networks}
            mevProtection={mevProtection}
            error={error}
            onSwitchNetwork={handleSwitchNetwork}
            isLegacy={isLegacy}
            onMigrateLegacy={handleMigrateLegacy}
            onExportLegacy={handleExportLegacy}
          />
          {showLegacyModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Legacy Wallet Detected</h2>
                <p>Your wallet was created before seed phrase support. If you remove or reset this extension, you will lose access to your funds. Please migrate to a seed phrase wallet or export your private key.</p>
                <button className="connect-button" onClick={() => {/* TODO: launch migration flow */}}>Migrate to Seed Phrase Wallet</button>
                <button className="secondary-button" onClick={() => {/* TODO: launch export flow */}}>Export Private Key</button>
                <button className="secondary-button" onClick={() => setShowLegacyModal(false)}>Remind Me Later</button>
              </div>
            </div>
          )}
          {showMigrationBackupModal && migrationMnemonic && (
            <SeedPhraseBackupModal
              mnemonic={migrationMnemonic}
              onConfirm={async () => {
                setShowMigrationBackupModal(false);
                // 2. Get the current account's private key
                const fullState = await walletService.getState();
                const legacyAccount = fullState.accounts[0];
                if (!legacyAccount || !legacyAccount.privateKey) {
                  alert('Legacy account or private key not found.');
                  return;
                }
                // 3. Create new wallet with new seed
                await walletService.createWallet('temp-migrate-password', true, migrationMnemonic);
                // 4. Import legacy private key as imported account
                await walletService.importAccountFromPrivateKey(legacyAccount.privateKey, legacyAccount.name || 'Migrated Account');
                alert('Migration complete! Please keep your new seed phrase safe.');
                setIsLegacy(false);
                setShowLegacyModal(false);
                setMigrationMnemonic(null);
              }}
            />
          )}
          {showMigrationWizard && legacyAccount && (
            <MigrationWizard
              legacyAccount={legacyAccount}
              walletService={walletService}
              onComplete={() => {
                setShowMigrationWizard(false);
                setIsLegacy(false);
                setShowLegacyModal(false);
                setLegacyAccount(null);
              }}
              onCancel={() => setShowMigrationWizard(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Failed to find the root element')
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
) 