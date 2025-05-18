import React, { useState } from 'react';

interface SeedPhraseBackupModalProps {
  mnemonic: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const SeedPhraseBackupModal: React.FC<SeedPhraseBackupModalProps> = ({
  mnemonic,
  onConfirm,
  onBack,
  isLoading
}) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  const handleConfirm = () => {
    if (!hasConfirmed) {
      setError('Please confirm that you have backed up your seed phrase');
      return;
    }
    onConfirm();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className="seed-phrase-modal card">
      <div className="accent-bar" />
      <h2>Back Up Your Seed Phrase</h2>
      <p className="warning-banner">
        ⚠️ Write down these 12 words in order and keep them safe. 
        Anyone with these words can access your wallet.
      </p>

      <div style={{ position: 'relative' }}>
        <div className="seed-phrase-box">
          {mnemonic.split(' ').map((word, index) => (
            <div key={index} className="seed-word">
              <span className="word-number">{index + 1}</span>
              <span className="word">{word}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Copy seed phrase"
          className="secondary-button"
          style={{ position: 'absolute', top: 10, right: 10, padding: '4px 12px', fontSize: '0.95em', zIndex: 2 }}
          onClick={handleCopy}
        >
          {copyStatus ? copyStatus : 'Copy'}
        </button>
        </div>

      <div className="confirmation-checkbox">
        <input
          type="checkbox"
          id="backup-confirm"
          checked={hasConfirmed}
          onChange={(e) => setHasConfirmed(e.target.checked)}
        />
        <label htmlFor="backup-confirm">
          I have backed up my seed phrase in a secure location
        </label>
        </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button 
          onClick={onBack}
          className="secondary-button"
          disabled={isLoading}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="primary-button"
          disabled={isLoading || !hasConfirmed}
        >
          {isLoading ? 'Creating Wallet...' : 'I Have Backed Up My Seed Phrase'}
        </button>
      </div>
    </div>
  );
};

export default SeedPhraseBackupModal; 