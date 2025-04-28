import { createRoot } from 'react-dom/client'
import { useState, useEffect, lazy, Suspense } from 'react'
import { walletService } from '../shared/services/wallet'
import type { Account, Network } from '../shared/types/wallet'
import './style.css'

// Lazy load the wallet components
const WalletContent = lazy(() => import('./components/WalletContent'))
const CreateWallet = lazy(() => import('./components/CreateWallet'))

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const loadWalletState = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const state = await walletService.getState()
        setIsUnlocked(state.isUnlocked)
        setSelectedAccount(state.selectedAccount)
        setSelectedNetwork(state.selectedNetwork)
        setNetworks(state.networks)
      } catch (err) {
        console.error('Failed to load wallet state:', err)
        setError('Failed to load wallet state. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadWalletState()
  }, [])

  const handleCreateWallet = async () => {
    try {
      setIsCreating(true)
      setError(null)
      await walletService.createWallet('your-password') // In production, get this from user input
      const state = await walletService.getState()
      setIsUnlocked(state.isUnlocked)
      setSelectedAccount(state.selectedAccount)
    } catch (error) {
      console.error('Failed to create wallet:', error)
      setError('Failed to create wallet. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSwitchNetwork = async (chainId: string) => {
    try {
      setError(null)
      await walletService.setNetwork(chainId)
      const state = await walletService.getState()
      setSelectedNetwork(state.selectedNetwork)
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError('Failed to switch network. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="popup-container" role="dialog" aria-label="FreoBus Wallet">
        <div className="popup-content">
          <div className="loading-spinner" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-container" role="dialog" aria-label="FreoBus Wallet">
      <div className="popup-header">
        <div className="wallet-icon" role="img" aria-label="Wallet icon" />
        <h1>FreoBus Wallet</h1>
      </div>
      <Suspense fallback={
        <div className="loading-spinner" role="status">
          <span className="sr-only">Loading wallet...</span>
        </div>
      }>
        {!isUnlocked ? (
          <CreateWallet 
            isCreating={isCreating}
            setIsCreating={setIsCreating}
            error={error}
            onCreateWallet={handleCreateWallet}
          />
        ) : (
          <WalletContent 
            selectedAccount={selectedAccount}
            selectedNetwork={selectedNetwork}
            networks={networks}
            error={error}
            onSwitchNetwork={handleSwitchNetwork}
          />
        )}
      </Suspense>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
} 