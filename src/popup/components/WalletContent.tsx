import React, { useState } from 'react'
import type { Account, Network } from '../../shared/types/wallet'

interface WalletContentProps {
  selectedAccount: Account | null | undefined
  selectedNetwork: Network | null
  networks: Network[]
  error: string | null
  onSwitchNetwork: (chainId: string) => Promise<void>
}

const WalletContent: React.FC<WalletContentProps> = ({
  selectedAccount,
  selectedNetwork,
  networks,
  error,
  onSwitchNetwork
}) => {
  const [showCopied, setShowCopied] = useState(false)

  const copyAddress = async () => {
    if (selectedAccount?.address) {
      await navigator.clipboard.writeText(selectedAccount.address)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  const openBlockExplorer = () => {
    if (selectedAccount?.address && selectedNetwork?.blockExplorerUrl) {
      window.open(`${selectedNetwork.blockExplorerUrl}/address/${selectedAccount.address}`, '_blank')
    }
  }

  return (
    <div className="popup-content">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <div className="welcome-message">
        <h2>Welcome to FreoBus Wallet! 🎉</h2>
        <p>Your wallet is ready to use. Here's what you can do:</p>
      </div>

      <div className="wallet-info">
        <div className="account-section">
          <div className="section-header">
            <h2 id="account-heading">Account</h2>
            <div className="action-buttons">
              <button 
                className="icon-button"
                onClick={copyAddress}
                title="Copy address"
                aria-label="Copy address to clipboard"
              >
                📋
                {showCopied && <span className="tooltip">Copied!</span>}
              </button>
              <button 
                className="icon-button"
                onClick={openBlockExplorer}
                title="View in block explorer"
                aria-label="View account in block explorer"
                disabled={!selectedNetwork?.blockExplorerUrl}
              >
                🔍
              </button>
            </div>
          </div>
          {selectedAccount && (
            <div 
              className="account-item"
              role="region"
              aria-labelledby="account-heading"
            >
              <div className="account-name">{selectedAccount.name}</div>
              <div className="account-address">{selectedAccount.address}</div>
              <div className="account-balance">
                {selectedAccount.balances[selectedNetwork?.chainId || ''] || '0'} {selectedNetwork?.currencySymbol}
              </div>
            </div>
          )}
        </div>

        <div className="network-section">
          <h2 id="network-heading">Network</h2>
          <select 
            value={selectedNetwork?.chainId} 
            onChange={(e) => onSwitchNetwork(e.target.value)}
            aria-labelledby="network-heading"
            className="network-select"
          >
            {networks.map(network => (
              <option key={network.chainId} value={network.chainId}>
                {network.name}
              </option>
            ))}
          </select>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button" onClick={() => {}}>
              Send
            </button>
            <button className="action-button" onClick={() => {}}>
              Receive
            </button>
            <button className="action-button" onClick={() => {}}>
              Add Token
            </button>
          </div>
        </div>

        <div className="help-section">
          <h3>Need Help?</h3>
          <ul>
            <li>To receive funds, copy your address and share it with the sender</li>
            <li>To send funds, click the Send button and enter the recipient's address</li>
            <li>To view your account on the blockchain, click the 🔍 icon</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default WalletContent 