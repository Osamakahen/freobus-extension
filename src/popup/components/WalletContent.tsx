import React from 'react'
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
  return (
    <div className="popup-content">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      <div className="wallet-info">
        <div className="account-section">
          <h2 id="account-heading">Account</h2>
          {selectedAccount && (
            <div 
              className="account-item"
              role="region"
              aria-labelledby="account-heading"
            >
              {selectedAccount.name} ({selectedAccount.address})
            </div>
          )}
        </div>
        <div className="balance-section">
          <h2 id="network-heading">Network</h2>
          <select 
            value={selectedNetwork?.chainId} 
            onChange={(e) => onSwitchNetwork(e.target.value)}
            aria-labelledby="network-heading"
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
  )
}

export default WalletContent 