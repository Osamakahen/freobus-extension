import React from 'react'
import type { Account, Network } from '../../shared/types/wallet'
import TransactionHistory from './TransactionHistory'
import NetworkSelector from './NetworkSelector'
import '../styles/TransactionHistory.css'
import '../styles/NetworkSelector.css'

// Simple blockie identicon generator (for demo, not cryptographically secure)
function makeBlockie(address: string) {
  // Use a simple colored circle with the first 2/last 2 chars for now
  const color = `hsl(${parseInt(address.slice(-4), 16) % 360}, 70%, 60%)`;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }}>
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

const getIconUrl = (icon: string | undefined, fallback: string) => {
  if (icon) return chrome.runtime.getURL(icon)
  return chrome.runtime.getURL(fallback)
}

// SVG icons for menu
const icons = {
  notifications: <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-1.29 1.29A1 1 0 0 0 6 20h12a1 1 0 0 0 .71-1.71L18 16Z"/></svg>,
  details: <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  explorer: <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 3h7v7m-1.5-5.5L10 17l-4 4-3-3 4-4L19.5 4.5Z"/></svg>,
  lock: <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="8" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/></svg>
}

interface WalletContentProps {
  selectedAccount: Account | null
  selectedNetwork: Network | null
}

const WalletContent: React.FC<WalletContentProps> = ({
  selectedAccount,
  selectedNetwork
}) => {
  const [activeTab, setActiveTab] = React.useState<'tokens' | 'nfts' | 'activity'>('tokens')
  const [copyStatus, setCopyStatus] = React.useState('')
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [showMenu, setShowMenu] = React.useState(false)
  const [transactions, setTransactions] = React.useState<any[]>([])

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatBalance = (balance: string) => parseFloat(balance || '0').toFixed(4)
  const chainId = selectedNetwork?.chainId;
  const balance = chainId ? selectedAccount?.balances[chainId] : null;
  const formatted = balance ? formatBalance(balance) : '0.0000';

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      setCopyStatus('Copied!');
      setShowTooltip(true);
      setTimeout(() => {
        setCopyStatus('');
        setShowTooltip(false);
      }, 1200);
    }
  };

  // Logo watermark (bottom right)
  const logoUrl = chrome.runtime.getURL('icons/logo.svg');

  const handleNetworkChange = async (network: Network) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'switch_network',
        network
      });
      
      if (!response.success) {
        console.error('Failed to switch network:', response.error);
      }
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  React.useEffect(() => {
    // Fetch transactions when activity tab is selected
    if (activeTab === 'activity' && selectedAccount?.address) {
      chrome.runtime.sendMessage({ 
        action: 'get_transaction_history',
        address: selectedAccount.address
      }).then(response => {
        if (response.success) {
          setTransactions(response.transactions)
        }
      })
    }
  }, [activeTab, selectedAccount?.address])

  return (
    <div className="wallet-card">
      {/* Animated Accent Bar */}
      <div className="wallet-accent animated-gradient" />
      {/* Large, subtle watermark at center bottom */}
      <img src={logoUrl} alt="FreoBus Logo" className="wallet-watermark center-bottom" />
      {/* Header row: network selector left, menu right */}
      <div className="wallet-header-row">
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onNetworkChange={handleNetworkChange}
        />
        <button className="menu-btn" onClick={() => setShowMenu(!showMenu)} tabIndex={0} aria-label="Account menu">
          <span className="menu-icon">⋮</span>
          </button>
        {showMenu && (
          <div className="account-menu-dropdown modern">
            <div className="account-menu-item"><span className="menu-item-icon">{icons.notifications}</span>Notifications <span className="menu-item-badge">New!</span></div>
            <div className="account-menu-item"><span className="menu-item-icon">{icons.details}</span>Account details</div>
            <div className="account-menu-item"><span className="menu-item-icon">{icons.explorer}</span>View on explorer</div>
            <div className="account-menu-item"><span className="menu-item-icon">{icons.lock}</span>Lock Wallet</div>
          </div>
        )}
      </div>
      {/* Identicon and account name below header */}
      <div className="account-identicon-row">
        {selectedAccount?.address && makeBlockie(selectedAccount.address)}
        <span className="wallet-account-name">{selectedAccount?.name || 'Account'}</span>
                  </div>
      {/* Address row */}
      <div className="address-row">
          <span
          className="wallet-account-address"
            onClick={handleCopyAddress}
          title="Copy address"
          style={{ cursor: 'pointer', position: 'relative', marginLeft: 0 }}
          onMouseEnter={() => setShowTooltip(!!copyStatus)}
          onMouseLeave={() => setShowTooltip(false)}
          >
            {selectedAccount?.address ? formatAddress(selectedAccount.address) : ''}
          <span className="copy-icon" style={{ marginLeft: 4 }}>📋</span>
          {showTooltip && (
            <span className="copy-tooltip">{copyStatus || 'Copy'}</span>
          )}
          </span>
      </div>
      <div className="header-divider" />
      <div className="wallet-balance">
        <div className="wallet-balance-main">{formatted} {selectedNetwork?.currencySymbol || 'ETH'}</div>
        <div className="wallet-balance-fiat">$0.00 USD</div>
      </div>
      <div className="wallet-actions">
        <button className="action-btn" title="Swap"><span>⇄</span><div>Swap</div></button>
        <button className="action-btn" title="Buy"><span>↓</span><div>Buy</div></button>
        <button className="action-btn" title="Send"><span>↑</span><div>Send</div></button>
        <button className="action-btn" title="Receive"><span>⤓</span><div>Receive</div></button>
      </div>
      <div className="wallet-tabs">
        <button className={activeTab === 'tokens' ? 'active' : ''} onClick={() => setActiveTab('tokens')}>Tokens</button>
        <button className={activeTab === 'nfts' ? 'active' : ''} onClick={() => setActiveTab('nfts')}>NFTs</button>
        <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>Activity</button>
      </div>
      <div className="wallet-tab-content">
        {activeTab === 'tokens' && (
          <div className="wallet-token-list">
            <div className="wallet-token-item">
              <img src={getIconUrl(undefined, 'icons/ethereum.svg')} alt="ETH" />
              <div>
                <div className="wallet-token-name">Ethereum</div>
                <div className="wallet-token-balance">{formatted} {selectedNetwork?.currencySymbol || 'ETH'}</div>
              </div>
              <div className="wallet-token-value">$0.00</div>
            </div>
          </div>
        )}
        {activeTab === 'nfts' && <div className="wallet-empty-state">No NFTs found</div>}
        {activeTab === 'activity' && (
          <TransactionHistory 
            transactions={transactions}
            selectedNetwork={selectedNetwork}
          />
        )}
      </div>
    </div>
  )
}

export default WalletContent 