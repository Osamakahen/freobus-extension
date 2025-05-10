import React, { useState } from 'react';
import { ethers } from 'ethers';
import SeedPhraseBackupModal from './SeedPhraseBackupModal';

interface MigrationWizardProps {
  legacyAccount: { privateKey: string; name?: string };
  onComplete: () => void;
  onCancel: () => void;
  walletService: any;
}

const MigrationWizard: React.FC<MigrationWizardProps> = ({ legacyAccount, onComplete, onCancel, walletService }) => {
  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const startMigration = async () => {
    const wallet = await ethers.Wallet.createRandom();
    setMnemonic(wallet.mnemonic.phrase);
    setStep(2);
  };

  const handleBackupConfirm = async () => {
    setIsMigrating(true);
    await walletService.createWallet('temp-migrate-password', true, mnemonic);
    await walletService.importAccountFromPrivateKey(legacyAccount.privateKey, legacyAccount.name || 'Migrated Account');
    setIsMigrating(false);
    setStep(3);
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
          <SeedPhraseBackupModal mnemonic={mnemonic} onConfirm={handleBackupConfirm} />
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