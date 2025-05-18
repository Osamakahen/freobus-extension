import React, { useState } from 'react';
import SeedPhraseBackupModal from './SeedPhraseBackupModal';

interface MigrationWizardProps {
  legacyAccount: { privateKey: string; name?: string };
  onComplete: () => void;
  onCancel: () => void;
}

const MigrationWizard: React.FC<MigrationWizardProps> = ({ legacyAccount, onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(1);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const startMigration = async () => {
    chrome.runtime.sendMessage({ action: "create_wallet" }, (response) => {
      if (response && response.success) {
        setMnemonic(response.mnemonic);
    setStep(2);
      } else {
        // handle error
      }
    });
  };

  const handleBackupConfirm = async () => {
    setIsMigrating(true);
    chrome.runtime.sendMessage({ action: "import_account", data: { privateKey: legacyAccount.privateKey, name: legacyAccount.name || 'Migrated Account' } }, () => {
    setIsMigrating(false);
    setStep(3);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 1 && (
          <>
            <h2>Legacy Wallet Migration</h2>
            <p>Your wallet was created before seed phrase support. To secure your funds, migrate to a new wallet with a seed phrase. You will be able to import your existing account.</p>
            <button className="connect-button" onClick={startMigration}>Start Migration</button>
            <button className="secondary-button" onClick={onCancel}>Cancel</button>
          </>
        )}
        {step === 2 && mnemonic && (
          <SeedPhraseBackupModal
            mnemonic={mnemonic}
            onConfirm={handleBackupConfirm}
            onBack={() => setStep(1)}
            isLoading={false}
          />
        )}
        {step === 3 && (
          <>
            <h2>Migration Complete!</h2>
            <p>Your wallet has been migrated. Please keep your new seed phrase safe. You can now use your wallet securely.</p>
            <button className="connect-button" onClick={onComplete}>Finish</button>
          </>
        )}
        {isMigrating && <div className="loading-spinner" style={{ marginTop: 16 }}>Migrating...</div>}
      </div>
    </div>
  );
};

export default MigrationWizard; 