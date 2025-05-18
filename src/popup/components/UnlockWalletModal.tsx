import React, { useState } from 'react';

interface UnlockWalletModalProps {
  onUnlock: (password: string) => Promise<boolean>;
  onForgot: () => void;
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 3;

const UnlockWalletModal: React.FC<UnlockWalletModalProps> = ({ onUnlock, onForgot, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const success = await onUnlock(password);
    setIsLoading(false);
    if (success) {
      setPassword('');
      setFailedAttempts(0);
      onSuccess();
    } else {
      setFailedAttempts(attempts => attempts + 1);
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="card" style={{ marginTop: 32 }}>
      <div className="accent-bar" />
      <h2>Unlock Your Wallet</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="unlock-password">Password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="unlock-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '6px 10px', fontSize: '0.95em', minWidth: 0 }}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="button-group">
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading || !password}
          >
            {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
          </button>
        </div>
      </form>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          className="secondary-button"
          style={{ fontSize: '0.95em', padding: '4px 10px', minWidth: 0 }}
          onClick={onForgot}
        >
          Forgot your password?
        </button>
        {failedAttempts >= MAX_ATTEMPTS && (
          <div style={{ marginTop: 12 }}>
            <button
              className="secondary-button"
              style={{ fontSize: '0.95em', padding: '4px 10px', minWidth: 0, background: '#fffbe6', color: '#b38600', borderColor: '#FFD700' }}
              onClick={onForgot}
            >
              Restore with Seed Phrase
            </button>
            <div style={{ fontSize: '0.92em', color: '#b38600', marginTop: 4 }}>
              Too many failed attempts? Restore your wallet using your seed phrase.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnlockWalletModal; 