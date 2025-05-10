import React, { useState } from 'react';

interface SeedPhraseBackupModalProps {
  mnemonic: string;
  onConfirm: () => void;
}

const SeedPhraseBackupModal: React.FC<SeedPhraseBackupModalProps> = ({ mnemonic, onConfirm }) => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([mnemonic], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'freowallet-seed.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Your Seed Phrase</h2>
        <div className="seed-phrase-box" tabIndex={0} aria-label="Seed phrase" style={{ userSelect: 'none', fontWeight: 600, fontSize: 18, letterSpacing: 1 }}>
          {mnemonic}
        </div>
        <div className="seed-actions" style={{ margin: '12px 0' }}>
          <button onClick={handleCopy}>Copy</button>
          <button onClick={handleDownload}>Download</button>
          {copied && <span className="copy-status" style={{ color: 'green', marginLeft: 8 }}>Copied!</span>}
        </div>
        <div className="backup-confirm" style={{ margin: '12px 0' }}>
          <input type="checkbox" id="confirm-backup" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
          <label htmlFor="confirm-backup" style={{ marginLeft: 8 }}>I understand that losing my seed phrase means losing access to my funds.</label>
        </div>
        <button className="connect-button" onClick={onConfirm} disabled={!confirmed}>Continue</button>
      </div>
    </div>
  );
};

export default SeedPhraseBackupModal; 