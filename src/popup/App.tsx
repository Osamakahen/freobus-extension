import React, { useState, useEffect } from 'react';
import Welcome from './components/Welcome';
import CreateWallet from './components/CreateWallet';
import WalletContent from './components/WalletContent';
import { Network } from '../shared/types/wallet';

type Screen = 'welcome' | 'create' | 'wallet';

interface WalletResponse {
  success: boolean;
  error?: string;
  isInitialized?: boolean;
  network?: Network;
}

interface Account {
  index: number;
  address: string;
  balances: Record<string, string>;
}

interface WalletState {
  isInitialized: boolean;
  accounts: Account[];
  selectedNetwork: Network | null;
  networks: Network[];
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>({
    isInitialized: false,
    accounts: [],
    selectedNetwork: null,
    networks: []
  });

  useEffect(() => {
    // Check if wallet is already initialized
    chrome.runtime.sendMessage({ type: 'checkWalletStatus' }, (response: WalletResponse) => {
      if (response.isInitialized) {
        setCurrentScreen('wallet');
        setWalletState(prev => ({ ...prev, isInitialized: true }));
      }
    });
  }, []);

  const handleGetStarted = () => {
    setCurrentScreen('create');
  };

  const handleCreateWallet = async (password: string) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await new Promise<WalletResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'createWallet', data: { password } },
          resolve
        );
      });

      if (response.success) {
        setWalletState(prev => ({ ...prev, isInitialized: true }));
        setCurrentScreen('wallet');
      } else {
        throw new Error(response.error || 'Failed to create wallet');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchNetwork = async (chainId: string) => {
    try {
      const response = await new Promise<WalletResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'switchNetwork', data: { chainId } },
          resolve
        );
      });

      if (response.success && response.network) {
        setWalletState(prev => ({
          ...prev,
          selectedNetwork: response.network || null
        }));
      }
    } catch (err) {
      console.error('Failed to switch network:', err);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <Welcome onGetStarted={handleGetStarted} />;
      case 'create':
        return (
          <CreateWallet
            isCreating={isCreating}
            setIsCreating={setIsCreating}
            error={error || ''}
            onCreateWallet={handleCreateWallet}
          />
        );
      case 'wallet':
        return (
          <WalletContent
            selectedAccount={walletState.accounts[0] || null}
            selectedNetwork={walletState.selectedNetwork}
            networks={walletState.networks}
            error={error || ''}
            onSwitchNetwork={handleSwitchNetwork}
          />
        );
      default:
        return <Welcome onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
    </div>
  );
};

export default App; 