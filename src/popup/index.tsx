import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { walletService } from '../shared/services/wallet'
import { Network } from '../shared/types/wallet'
import "./style.css"

const Popup = () => {
  const [accounts, setAccounts] = useState<string[]>([])
  const [balance, setBalance] = useState<string>("0")
  const [isConnected, setIsConnected] = useState(false)
  const [network] = useState<Network>({
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io'
  })

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const walletAccounts = await walletService.getAccounts()
        setAccounts(walletAccounts.map(acc => acc.address))
        // Load balance for the first account
        if (walletAccounts.length > 0) {
          const account = walletAccounts[0]
          setBalance(account.balances[network.chainId] || '0')
        }
      } catch (error) {
        console.error('Failed to load wallet data:', error)
      }
    }
    loadWalletData()
  }, [network.chainId])

  const connectWallet = async () => {
    try {
      await walletService.connectSite(window.location.origin, [], [])
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const disconnectWallet = async () => {
    try {
      // TODO: Implement wallet disconnection
      setIsConnected(false)
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="wallet-icon" />
        <h1>FreoBus</h1>
      </header>
      <main className="popup-content">
        {!isConnected ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <div className="account-section">
              <h2>Accounts</h2>
              {accounts.map((account) => (
                <div key={account} className="account-item">
                  {account}
                </div>
              ))}
            </div>
            <div className="balance-section">
              <h2>Balance</h2>
              <p>{balance} {network.currencySymbol}</p>
            </div>
            <button onClick={disconnectWallet} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
} 