import React, { useState } from 'react'
import type { Account, Network } from '../../shared/types/wallet'

interface WalletContentProps {
  selectedAccount: Account | null
  selectedNetwork: Network | null
  networks: Network[]
  error: string
  onSwitchNetwork: (chainId: string) => Promise<void>
}

const WalletContent: React.FC<WalletContentProps> = ({
  selectedAccount,
  selectedNetwork,
  networks,
  error,
  onSwitchNetwork
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'activity'>('tokens')
  const [showNetworkList, setShowNetworkList] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    return parseFloat(balance || '0').toFixed(4)
  }

  return (
    <div className="wallet-content">
      {error && <div className="error-message">{error}</div>}

      {/* Header with Network Selector and Account */}
      <div className="wallet-header">
        <div className="network-selector" onClick={() => setShowNetworkList(!showNetworkList)}>
          <div className="network-indicator" />
          <span>{selectedNetwork?.name || 'Select Network'}</span>
          <span className="chevron-down">▼</span>
          
          {showNetworkList && (
            <div className="network-dropdown">
              {networks.map(network => (
                <div
                  key={network.chainId}
                  className={`network-option ${network.chainId === selectedNetwork?.chainId ? 'active' : ''}`}
                  onClick={() => onSwitchNetwork(network.chainId)}
                >
                  <div className="network-option-indicator" />
                  <span>{network.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="account-info">
          <span className="account-name">{selectedAccount?.name}</span>
          <span className="account-address">{selectedAccount?.address ? formatAddress(selectedAccount.address) : ''}</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="balance-display">
        <h2 className="balance-amount">
          {selectedAccount?.balances[selectedNetwork?.chainId || ''] 
            ? `${formatBalance(selectedAccount.balances[selectedNetwork?.chainId || ''])} ${selectedNetwork?.currencySymbol}`
            : '0.0000 ETH'
          }
        </h2>
        <p className="balance-fiat">$0.00 USD</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-button">
          <span className="action-icon">↓</span>
          <span>Buy</span>
        </button>
        <button className="action-button">
          <span className="action-icon">↑</span>
          <span>Send</span>
        </button>
        <button className="action-button">
          <span className="action-icon">↔</span>
          <span>Swap</span>
        </button>
        <button className="action-button">
          <span className="action-icon">⋮</span>
          <span>More</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
        <button 
          className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
          onClick={() => setActiveTab('nfts')}
        >
          NFTs
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'tokens' && (
          <div className="token-list">
            <div className="token-item main-token">
              <div className="token-icon eth" />
              <div className="token-info">
                <span className="token-name">Ethereum</span>
                <span className="token-balance">
                  {selectedAccount?.balances[selectedNetwork?.chainId || ''] 
                    ? formatBalance(selectedAccount.balances[selectedNetwork?.chainId || ''])
                    : '0.0000'
                  } ETH
                </span>
              </div>
              <div className="token-value">$0.00 USD</div>
            </div>
            
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No tokens found</h3>
              <p>Get started by adding some tokens to your wallet</p>
              <button className="secondary-button">Import Tokens</button>
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="empty-state">
            <div className="empty-icon">🖼️</div>
            <h3>No NFTs found</h3>
            <p>NFTs you receive will appear here</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No activity yet</h3>
            <p>Your transaction history will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletContent 