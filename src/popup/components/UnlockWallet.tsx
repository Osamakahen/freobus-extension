import React, { useState } from 'react';

interface UnlockWalletProps {
  onUnlock: (password: string) => Promise<void>;
  error: string;
}

const UnlockWallet: React.FC<UnlockWalletProps> = ({ onUnlock, error }) => {
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }
    setIsUnlocking(true);
    try {
      await onUnlock(password);
    } catch (err) {
      setLocalError('Incorrect password. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="unlock-wallet">
      <h2>Unlock Your Wallet</h2>
      <form onSubmit={handleSubmit}>
        {(error || localError) && (
          <div className="error-message" role="alert">
            {error || localError}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isUnlocking}
            required
          />
        </div>
        <button
          type="submit"
          className="connect-button"
          disabled={isUnlocking}
        >
          {isUnlocking ? 'Unlocking...' : 'Unlock Wallet'}
        </button>
      </form>
    </div>
  );
};

export default UnlockWallet; 