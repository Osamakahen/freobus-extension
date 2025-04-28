import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { walletService } from '../shared/services/wallet'
import type { Account, Network } from '../shared/types/wallet'
import './style.css'

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])

  useEffect(() => {
    const loadWalletState = async () => {
      const state = await walletService.getState()
      setIsUnlocked(state.isUnlocked)
      setSelectedAccount(state.selectedAccount)
      setAccounts(state.accounts)
      setSelectedNetwork(state.selectedNetwork)
      setNetworks(state.networks)
    }
    loadWalletState()
  }, [])

  const handleCreateWallet = async () => {
    try {
      await walletService.createWallet('your-password') // In production, get this from user input
      const state = await walletService.getState()
      setIsUnlocked(state.isUnlocked)
      setSelectedAccount(state.selectedAccount)
      setAccounts(state.accounts)
    } catch (error) {
      console.error('Failed to create wallet:', error)
    }
  }

  const handleSwitchNetwork = async (chainId: string) => {
    try {
      await walletService.setNetwork(chainId)
      const state = await walletService.getState()
      setSelectedNetwork(state.selectedNetwork)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  if (!isUnlocked) {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <div className="wallet-icon" />
          <h1>FreoBus Wallet</h1>
        </div>
        <div className="popup-content">
          <button className="connect-button" onClick={handleCreateWallet}>
            Create New Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="wallet-icon" />
        <h1>FreoBus Wallet</h1>
      </div>
      <div className="popup-content">
        <div className="wallet-info">
          <div className="account-section">
            <h2>Account</h2>
            {selectedAccount && (
              <div className="account-item">
                {selectedAccount.name} ({selectedAccount.address})
              </div>
            )}
          </div>
          <div className="balance-section">
            <h2>Network</h2>
            <select 
              value={selectedNetwork?.chainId} 
              onChange={(e) => handleSwitchNetwork(e.target.value)}
            >
              {networks.map(network => (
                <option key={network.chainId} value={network.chainId}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
} 