import React, { useState } from 'react';

interface ExportPrivateKeyModalProps {
  privateKey: string;
  onClose: () => void;
}

const ExportPrivateKeyModal: React.FC<ExportPrivateKeyModalProps> = ({ privateKey, onClose }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Export Private Key</h3>
        <div className="warning-box" style={{ color: 'red', marginBottom: 12 }}>
          <strong>Warning:</strong> Never share your private key. Anyone with this key can access your funds.
        </div>
        <div className="private-key-box" style={{ marginBottom: 12 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={privateKey}
            readOnly
            style={{ width: '100%', fontSize: 16, letterSpacing: 1 }}
            aria-label="Private key"
          />
          <button onClick={() => setShowKey(v => !v)} style={{ marginLeft: 8 }}>
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <button onClick={handleCopy}>Copy</button>
        {copied && <span className="copy-status" style={{ color: 'green', marginLeft: 8 }}>Copied!</span>}
        <button className="secondary-button" onClick={onClose} style={{ marginLeft: 12 }}>Close</button>
      </div>
    </div>
  );
};

export default ExportPrivateKeyModal; 