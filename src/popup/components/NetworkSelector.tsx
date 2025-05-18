import React from 'react';
import { Network } from '../../shared/types/wallet';
import { networks } from '../../shared/networks';
import '../styles/NetworkSelector.css';

interface NetworkSelectorProps {
  selectedNetwork: Network | null;
  onNetworkChange: (network: Network) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNetworkSelect = (network: Network) => {
    onNetworkChange(network);
    setIsOpen(false);
  };

  const getIconUrl = (icon: string | undefined) => {
    if (icon) return chrome.runtime.getURL(icon);
    return chrome.runtime.getURL('icons/ethereum.svg');
  };

  return (
    <div className="network-selector">
      <button
        className="network-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <img
          src={getIconUrl(selectedNetwork?.icon)}
          alt={selectedNetwork?.name || 'Network'}
          className="network-icon"
        />
        <span className="network-name">{selectedNetwork?.name || 'Select Network'}</span>
        <span className="network-chevron">▼</span>
      </button>

      {isOpen && (
        <div className="network-dropdown">
          {networks.map((network) => (
            <button
              key={network.chainId}
              className={`network-option ${selectedNetwork?.chainId === network.chainId ? 'active' : ''}`}
              onClick={() => handleNetworkSelect(network)}
            >
              <img
                src={getIconUrl(network.icon)}
                alt={network.name}
                className="network-icon"
              />
              <span className="network-name">{network.name}</span>
              {selectedNetwork?.chainId === network.chainId && (
                <span className="network-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkSelector; 