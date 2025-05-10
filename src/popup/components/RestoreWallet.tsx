import React, { useState } from 'react'

interface RestoreWalletProps {
  isRestoring: boolean
  setIsRestoring: (restoring: boolean) => void
  error: string | null
  onRestoreWallet: (password: string, mnemonic: string) => Promise<void>
}

const RestoreWallet: React.FC<RestoreWalletProps> = ({
  isRestoring,
  error,
  onRestoreWallet
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (!mnemonic.trim()) {
      setValidationError('Please enter your seed phrase')
      return
    }
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
    // Basic mnemonic validation (12 or 24 words)
    const words = mnemonic.trim().split(/\s+/)
    if (words.length !== 12 && words.length !== 24) {
      setValidationError('Seed phrase must be 12 or 24 words')
      return
    }
    await onRestoreWallet(password, mnemonic.trim())
  }

  return (
    <div className="popup-content">
      <form onSubmit={handleSubmit}>
        {(error || validationError) && (
          <div className="error-message" role="alert">
            {error || validationError}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="mnemonic">Seed Phrase</label>
          <textarea
            id="mnemonic"
            value={mnemonic}
            onChange={e => setMnemonic(e.target.value)}
            placeholder="Enter your 12 or 24 word seed phrase"
            rows={3}
            disabled={isRestoring}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a strong password (min. 8 characters)"
            disabled={isRestoring}
            required
            minLength={8}
          />
          <small className="input-help">This password will be used to protect your wallet</small>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Enter the same password again"
            disabled={isRestoring}
            required
            minLength={8}
          />
        </div>
        <button
          className={`connect-button ${isRestoring ? 'loading' : ''}`}
          type="submit"
          disabled={isRestoring}
          aria-busy={isRestoring}
        >
          {isRestoring ? 'Restoring Wallet...' : 'Restore Wallet'}
        </button>
      </form>
    </div>
  )
}

export default RestoreWallet 