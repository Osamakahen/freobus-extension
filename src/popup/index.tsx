import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Account, Network } from '../shared/types/wallet'
import { walletService } from '../shared/services/wallet'
import './style.css'
import Welcome from './components/Welcome'
import WalletContent from './components/WalletContent'
import { NetworkStateManager } from '../network/NetworkStateManager'
import RestoreWallet from './components/RestoreWallet'
import UnlockWallet from './components/UnlockWallet'
import CreateWallet from './components/CreateWallet'
import { SessionAnalyticsManager } from '../analytics/SessionAnalyticsManager'

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
  const [showRestore, setShowRestore] = useState<boolean>(false)
  const [hasWallet, setHasWallet] = useState<boolean>(false)
  const [mevProtection, setMevProtection] = useState<any>(null)
  const [isLegacy, setIsLegacy] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  const networkStateManager = new NetworkStateManager();
  const analyticsManager = new SessionAnalyticsManager();

  useEffect(() => {
    const checkWallet = async () => {
      const exists = await walletService.hasWallet();
      setHasWallet(exists);
      // Optionally check if unlocked
      // setIsUnlocked(await walletService.isUnlocked());
      setIsLoading(false);
      console.log('Wallet check:', { exists });
    };
    checkWallet();
  }, []);

  console.log('Render state:', { isLoading, hasWallet, isUnlocked, showRestore, showUnlock });

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        console.log('[Init] Checking if wallet exists...');
        const walletExists = await walletService.hasWallet();
        setHasWallet(walletExists);
        console.log('[Init] Wallet exists:', walletExists);

        if (!walletExists) {
          setIsLoading(false);
          return;
        }

        console.log('[Init] Getting wallet state...');
        const state = await walletService.getState() as WalletState;
        setIsUnlocked(state.isUnlocked);
        if (state.isUnlocked && state.selectedAccount && state.selectedNetwork) {
          setSelectedAccount(state.selectedAccount);
          setSelectedNetwork(state.selectedNetwork);
          setNetworks(state.networks);
          // Fetch MEV protection for the selected network
          const ns = await networkStateManager.initializeNetworkState(state.selectedNetwork.chainId);
          setMevProtection(ns.mevProtection);
          const fullState = await walletService.getState();
          if (fullState.accounts && fullState.accounts.length > 0 && !await walletService.hasWallet()) {
            setIsLegacy(true);
          }
        } else {
          console.warn('[Init] Wallet state missing required fields:', state);
        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setError('Failed to initialize wallet: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    initializeWallet();
  }, []);

  const handleGetStarted = () => {
    setShowCreate(true);
    setShowUnlock(false);
    setShowRestore(false);
    setShowWelcome(false);
  }

  const handleConnect = () => {
    setIsUnlocked(false);
    setShowUnlock(true);
    setShowWelcome(false);
  }

  const handleSwitchNetwork = async (chainId: string) => {
    console.log('[handleSwitchNetwork] Received chainId:', chainId);
    try {
      setError('');
      await walletService.setNetwork(chainId);
      const state = await walletService.getState();
      setSelectedNetwork(state.selectedNetwork);
      // Fetch MEV protection for the new network
      const ns = await networkStateManager.initializeNetworkState(chainId);
      setMevProtection(ns.mevProtection);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      setError(error && error.message ? error.message : String(error));
    }
  };

  const handleRestoreWallet = async (password: string, mnemonic: string) => {
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
    } catch (err) {
      console.error('Error restoring wallet:', err)
      setError('Failed to restore wallet. Please check your seed phrase and try again.')
    }
  }

  const handleMigrateLegacy = async () => {
    // 1. Generate new seed phrase
    // const wallet = await ethers.Wallet.createRandom();
    // const mnemonic = wallet.mnemonic.phrase;
    // Open migration backup modal or handle migration logic here
  }

  const handleExportLegacy = () => {
    // Open export private key modal in WalletContent (already implemented)
    // Optionally, set a state to trigger export modal
  }

  const handleUnlockWallet = async (password: string) => {
    setError('');
    try {
      const success = await walletService.unlockWallet(password);
      if (success) {
        setIsUnlocked(true);
        const state = await walletService.getState() as WalletState;
        setSelectedAccount(state.selectedAccount || null);
        setSelectedNetwork(state.selectedNetwork || null);
        setNetworks(state.networks);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Failed to unlock wallet.');
    }
  };

  const handleCreateWallet = async (password: string, mnemonic: string) => {
    setError("");
    try {
      await walletService.createWallet(password, false, mnemonic);
      const state = await walletService.getState() as WalletState;
      setIsUnlocked(state.isUnlocked);
      setHasWallet(true);
      setShowCreate(false);
      if (state.selectedAccount && state.selectedNetwork) {
        setSelectedAccount(state.selectedAccount);
        setSelectedNetwork(state.selectedNetwork);
        setNetworks(state.networks);
      }
    } catch (err) {
      setError("Failed to create wallet. Please try again.");
    }
  };

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
        <Welcome
          onGetStarted={handleGetStarted}
          onConnect={handleConnect}
        />
      ) : showRestore ? (
        <RestoreWallet onRestore={handleRestoreWallet} error={error} />
      ) : showCreate ? (
        <CreateWallet onCreateWallet={handleCreateWallet} error={error} isCreating={isCreating} setIsCreating={setIsCreating} />
      ) : !hasWallet ? (
        <Welcome
          onGetStarted={handleGetStarted}
          onConnect={handleConnect}
        />
      ) : !isUnlocked ? (
        showUnlock ? (
          <>
            <UnlockWallet onUnlock={handleUnlockWallet} error={error} />
            <div style={{textAlign:'center',marginTop:'1em'}}>
              <button className="action-button tertiary" onClick={() => {
                setShowRestore(true);
                setShowUnlock(false);
                setShowWelcome(false);
                setShowCreate(false);
              }}>
                Forgot password? Restore with seed phrase
              </button>
            </div>
          </>
        ) : (
          <Welcome
            onGetStarted={handleGetStarted}
            onConnect={handleConnect}
          />
        )
      ) : (
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
          analyticsManager={analyticsManager}
        />
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