import React, { useState } from 'react'
// Removed ethers import to reduce popup bundle size

interface RestoreWalletProps {
  onRestore: (password: string, mnemonic: string) => Promise<void>
  error: string | null
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  margin: '16px 0',
  width: '100%'
};

const inputStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1.5px solid #e0e0e0',
  padding: '8px 10px',
  fontSize: '1em',
  textAlign: 'center',
  outline: 'none',
  width: '100%'
};

const RestoreWallet: React.FC<RestoreWalletProps> = ({
  onRestore,
  error
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [words, setWords] = useState(Array(12).fill(''))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleWordChange = (idx: number, value: string) => {
    setWords(words => words.map((w, i) => (i === idx ? value.replace(/\s/g, '') : w)))
  }

  const validateMnemonic = (words: string[]): boolean => words.every(w => w.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!password || !confirmPassword) {
      setValidationError('Please enter both password fields')
      return
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long')
      return
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }
    if (!validateMnemonic(words)) {
      setValidationError('Please enter all 12 seed words')
      return
    }
    const mnemonic = words.join(' ').trim()
    try {
      setIsRestoring(true)
      await onRestore(password, mnemonic)
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to restore wallet')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="restore-wallet card" style={{ maxWidth: 400, margin: '0 auto', marginTop: 32 }}>
      <div className="accent-bar" />
      <h2 style={{ color: '#008080', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Restore Your Wallet</h2>
      <p className="subtitle" style={{ textAlign: 'center', color: '#008080', marginBottom: 12 }}>Enter your 12-word seed phrase to restore your wallet</p>
      <form onSubmit={handleSubmit}>
        {(error || validationError) && (
          <div className="error-message" role="alert">
            {error || validationError}
          </div>
        )}
        <div className="form-group">
          <label style={{ color: '#008080', fontWeight: 600 }}>Seed Phrase</label>
          <div style={gridStyle}>
            {words.map((word, idx) => (
              <input
                key={idx}
                type="text"
                style={inputStyle}
                value={word}
                onChange={e => handleWordChange(idx, e.target.value)}
                disabled={isRestoring}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                placeholder={String(idx + 1)}
                maxLength={16}
              />
            ))}
          </div>
          <small className="input-help">Enter the 12 words in order, one per box</small>
        </div>
        <div className="form-group">
          <label htmlFor="password" style={{ color: '#008080', fontWeight: 600 }}>New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a new password (min. 8 characters)"
            disabled={isRestoring}
            required
            minLength={8}
            style={inputStyle}
          />
          <small className="input-help">This password will be used to protect your restored wallet</small>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword" style={{ color: '#008080', fontWeight: 600 }}>Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Enter the same password again"
            disabled={isRestoring}
            required
            minLength={8}
            style={inputStyle}
          />
        </div>
        <div className="button-group" style={{ marginTop: 18 }}>
          <button
            type="submit"
            className="primary-button"
            disabled={isRestoring}
            style={{ width: '100%' }}
          >
            {isRestoring ? 'Restoring...' : 'Restore Wallet'}
          </button>
        </div>
      </form>
      <div className="warning-banner" style={{ marginTop: 18 }}>
        <span role="img" aria-label="warning">⚠️</span>
        Never share your seed phrase with anyone. It provides full access to your wallet and funds.
      </div>
    </div>
  )
}

export default RestoreWallet 