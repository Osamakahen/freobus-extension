import React, { useState, useEffect } from 'react'
import type { Account, Network } from '../../shared/types/wallet'
import ExportPrivateKeyModal from './ExportPrivateKeyModal'
import WarningBanner from './WarningBanner'
import { SessionAnalyticsDashboard } from '../../components/SessionAnalyticsDashboard'

interface WalletContentProps {
  selectedAccount: Account | null
  selectedNetwork: Network | null
  networks: Network[]
  mevProtection?: any
  error: string
  onSwitchNetwork: (chainId: string) => Promise<void>
  isLegacy?: boolean
  onMigrateLegacy?: () => void
  onExportLegacy?: () => void
  analyticsManager?: any
}

const WalletContent: React.FC<WalletContentProps> = ({
  selectedAccount,
  selectedNetwork,
  networks,
  mevProtection,
  error,
  onSwitchNetwork,
  isLegacy,
  onMigrateLegacy,
  onExportLegacy,
  analyticsManager
}) => {
  // Early guard clause to prevent rendering if essential data is missing
  if (!selectedNetwork || !selectedAccount) {
    return <div className="wallet-content">Loading...</div>;
  }

  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'activity' | 'analytics' | 'mev'>('tokens')
  const [showNetworkList, setShowNetworkList] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [connectedSite, setConnectedSite] = useState('')

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [sendError, setSendError] = useState('');

  const [copyStatus, setCopyStatus] = useState('');

  const [exportedPK, setExportedPK] = useState<string | null>(null)

  const [hasBackedUpSeed, setHasBackedUpSeed] = useState(() => {
    return localStorage.getItem('freo_has_backed_up_seed') === 'true';
  });

  const [showExportPKModal, setShowExportPKModal] = useState(false)

  const markAsBackedUp = () => {
    localStorage.setItem('freo_has_backed_up_seed', 'true');
    setHasBackedUpSeed(true);
  };

  useEffect(() => {
    // On mount, check if connection is persisted
    const saved = localStorage.getItem('freo_connected_site')
    if (saved) {
      setIsConnected(true)
      setConnectedSite(saved)
    }
  }, [])

  const handleConnect = async () => {
    // Simulate connection logic (replace with real dApp connect logic as needed)
    const site = window.location.hostname || 'Current dApp'
    setIsConnected(true)
    setConnectedSite(site)
    localStorage.setItem('freo_connected_site', site)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setConnectedSite('')
    localStorage.removeItem('freo_connected_site')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    return parseFloat(balance || '0').toFixed(4)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendStatus('pending');
    setSendError('');
    try {
      // Call sendTransaction (to be implemented in wallet bridge)
      // You may need to get this from context or props
      if (!sendTo || !sendAmount) throw new Error('Recipient and amount required');
      // Example: await sendTransaction({ to: sendTo, value: sendAmount });
      setSendStatus('success');
      setSendTo('');
      setSendAmount('');
      setTimeout(() => setShowSendModal(false), 1500);
    } catch (err: any) {
      setSendStatus('error');
      setSendError(err.message || 'Failed to send transaction');
    }
  };

  const handleCopyAddress = () => {
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 1500);
    }
  };

  // Safer fallback for balance display
  const chainId = selectedNetwork?.chainId;
  const balance = chainId ? selectedAccount?.balances[chainId] : null;
  const formatted = balance ? formatBalance(balance) : '0.0000';

  return (
    <div className="wallet-content">
      {/* Connection Status Bar */}
      <div className="wallet-header">
        <img src="/logo.png" alt="FreoWallet" className="logo" style={{ height: 32, marginRight: 12 }} />
        {!isConnected ? (
          <button className="connect-btn" onClick={handleConnect} style={{ background: '#2d9cdb', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
            <span role="img" aria-label="link">🔗</span> Connect Wallet
          </button>
        ) : (
          <div className="connected-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dot green" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#27ae60', marginRight: 4 }}></span>
            Connected: {connectedSite}
            <button className="disconnect-btn" onClick={handleDisconnect} style={{ marginLeft: 8, background: '#eb5757', color: '#fff', border: 'none', borderRadius: 12, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer' }}>Disconnect</button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Header with Network Selector and Account */}
      <div className="wallet-header">
        <div className="header-top">
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
                    onClick={() => {
                      alert(`[NetworkDropdown] Switching to chainId: ${network.chainId}`);
                      onSwitchNetwork(network.chainId);
                    }}
                  >
                    <div className="network-option-indicator" />
                    <span>{network.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="menu-button" onClick={() => setShowMenu(!showMenu)}>
            ⋮
            {showMenu && (
              <div className="menu-dropdown">
                <button className="menu-item">
                  <span className="menu-icon">🔔</span>
                  Notifications
                </button>
                <button className="menu-item">
                  <span className="menu-icon">👤</span>
                  Account details
                </button>
                <button className="menu-item">
                  <span className="menu-icon">🔍</span>
                  View on explorer
                </button>
                <button className="menu-item">
                  <span className="menu-icon">⚙️</span>
                  Settings
                </button>
                <button className="menu-item">
                  <span className="menu-icon">🔒</span>
                  Lock FreoWallet
                </button>
                <button className="menu-item" onClick={() => setShowExportPKModal(true)}>
                  <span className="menu-icon">🔑</span>
                  Export Private Key
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="account-info">
          <span className="account-name">{selectedAccount?.name}</span>
          <span
            className="account-address"
            style={{ cursor: 'pointer', userSelect: 'all' }}
            onClick={handleCopyAddress}
            title="Click to copy"
          >
            {selectedAccount?.address ? formatAddress(selectedAccount.address) : ''}
          </span>
          {copyStatus && <span className="copy-status" style={{ marginLeft: 8, color: 'green', fontWeight: 500 }}>{copyStatus}</span>}
        </div>
      </div>

      {/* Balance Display */}
      <div className="balance-display">
        <h2 className="balance-amount">
          {formatted} {selectedNetwork?.currencySymbol || 'ETH'}
        </h2>
        <p className="balance-fiat">$0.00 USD</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-button">
          <span className="action-icon">↓</span>
          <span>Buy</span>
        </button>
        <button className="action-button" onClick={() => setShowSendModal(true)}>
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
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'mev' ? 'active' : ''}`}
          onClick={() => setActiveTab('mev')}
        >
          MEV Protection
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
                  {formatted} {selectedNetwork?.currencySymbol || 'ETH'}
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

        {activeTab === 'analytics' && (
          <div style={{ padding: '10px' }}>
            {analyticsManager ? (
              <SessionAnalyticsDashboard analyticsManager={analyticsManager} />
            ) : (
              <p>Analytics dashboard coming soon.</p>
            )}
          </div>
        )}

        {activeTab === 'mev' && (
          <div style={{ padding: '10px' }}>
            <h3>MEV Protection Settings</h3>
            {mevProtection ? (
              <ul>
                <li><b>Max Slippage:</b> {mevProtection.maxSlippage}%</li>
                <li><b>Use Private Pools:</b> {mevProtection.usePrivatePools ? 'Yes' : 'No'}</li>
                <li><b>Flashbot Protection:</b> {mevProtection.flashbotProtection ? 'Enabled' : 'Disabled'}</li>
              </ul>
            ) : (
              <p>No MEV protection settings available for this network.</p>
            )}
          </div>
        )}
      </div>

      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Send ETH</h2>
            <form onSubmit={handleSend}>
              <label>Recipient Address</label>
              <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} required />
              <label>Amount (ETH)</label>
              <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} required min="0" step="any" />
              <button type="submit" disabled={sendStatus === 'pending'}>Send</button>
              <button type="button" onClick={() => setShowSendModal(false)}>Cancel</button>
            </form>
            {sendStatus === 'pending' && <p>Sending...</p>}
            {sendStatus === 'success' && <p>Transaction sent!</p>}
            {sendStatus === 'error' && <p className="error-message">{sendError}</p>}
          </div>
        </div>
      )}

      {showExportPKModal && exportedPK && (
        <ExportPrivateKeyModal privateKey={exportedPK} onClose={() => {
          setShowExportPKModal(false);
          setExportedPK(null);
        }} />
      )}

      {!hasBackedUpSeed && (
        <WarningBanner
          type="warning"
          icon="⚠️"
          message={<><strong>Backup Required:</strong> If you remove or reset this extension without backing up your seed phrase, you will lose access to your funds forever.</>}
          actions={<button className="secondary-button" onClick={markAsBackedUp}>Mark as Backed Up</button>}
        />
      )}

      {isLegacy && (
        <WarningBanner
          type="danger"
          icon="⛔"
          message={<><strong>Legacy Wallet:</strong> Your wallet is not recoverable if you remove or reset this extension. Please migrate or export your private key now.</>}
          actions={
            <>
              <button className="link-button" onClick={onMigrateLegacy}>Migrate</button>
              <button className="link-button" onClick={onExportLegacy} style={{ marginLeft: 8 }}>Export Private Key</button>
            </>
          }
        />
      )}
    </div>
  )
}

export default WalletContent 