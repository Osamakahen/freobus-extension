import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Account, Network } from '../shared/types/wallet'
import { walletService } from '../shared/services/wallet'
import './style.css'
import Welcome from './components/Welcome'
import CreateWallet from './components/CreateWallet'
import WalletContent from './components/WalletContent'

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

  useEffect(() => {
    const loadWalletState = async () => {
      try {
        const state = await walletService.getState() as WalletState
        setIsUnlocked(state.isUnlocked)
        if (state.isUnlocked && state.selectedAccount && state.selectedNetwork) {
          setShowWelcome(false)
          setSelectedAccount(state.selectedAccount)
          setSelectedNetwork(state.selectedNetwork)
          setNetworks(state.networks)
        }
      } catch (err) {
        console.error('Error loading wallet state:', err)
        setError('Failed to load wallet state')
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletState()
  }, [])

  const handleCreateWallet = async (password: string) => {
    setIsCreating(true)
    setError('')
    try {
      console.log('Creating wallet...')
      await walletService.createWallet(password)
      console.log('Wallet created successfully')
      const state = await walletService.getState() as WalletState
      setIsUnlocked(state.isUnlocked)
      if (state.selectedAccount && state.selectedNetwork) {
        setSelectedAccount(state.selectedAccount)
        setSelectedNetwork(state.selectedNetwork)
        setNetworks(state.networks)
      }
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
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError('Failed to switch network. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading wallet...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (showWelcome) {
    return <Welcome onGetStarted={handleGetStarted} />
  }

  if (!isUnlocked) {
    return (
      <CreateWallet 
        onCreateWallet={handleCreateWallet} 
        isCreating={isCreating} 
        setIsCreating={setIsCreating}
        error={error}
      />
    )
  }

  return (
    <WalletContent
      selectedAccount={selectedAccount}
      selectedNetwork={selectedNetwork}
      networks={networks}
      error={error}
      onSwitchNetwork={handleSwitchNetwork}
    />
  )
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />) 