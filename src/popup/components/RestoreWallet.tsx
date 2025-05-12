import React, { useState } from 'react'
import { ethers } from 'ethers'

interface RestoreWalletProps {
  onRestore: (password: string, mnemonic: string) => Promise<void>
  error: string | null
}

const RestoreWallet: React.FC<RestoreWalletProps> = ({
  onRestore,
  error
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const validateMnemonic = (phrase: string): boolean => {
    try {
      return ethers.utils.isValidMnemonic(phrase.trim())
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validate password
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

    // Validate mnemonic
    if (!mnemonic.trim()) {
      setValidationError('Please enter your seed phrase')
      return
    }
    if (!validateMnemonic(mnemonic)) {
      setValidationError('Invalid seed phrase. Please check and try again.')
      return
    }

    try {
      setIsRestoring(true)
      await onRestore(password, mnemonic.trim())
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to restore wallet')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="restore-wallet">
      <h2>Restore Your Wallet</h2>
      <p className="subtitle">Enter your 12-word seed phrase to restore your wallet</p>

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
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="Enter your 12-word seed phrase"
            rows={3}
            disabled={isRestoring}
            required
          />
          <small className="input-help">Enter the 12 words in order, separated by spaces</small>
        </div>

        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a new password (min. 8 characters)"
            disabled={isRestoring}
            required
            minLength={8}
          />
          <small className="input-help">This password will be used to protect your restored wallet</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Enter the same password again"
            disabled={isRestoring}
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          className="restore-button"
          disabled={isRestoring}
        >
          {isRestoring ? 'Restoring...' : 'Restore Wallet'}
        </button>
      </form>

      <div className="security-warning">
        <p>⚠️ Never share your seed phrase with anyone. It provides full access to your wallet and funds.</p>
      </div>
    </div>
  )
}

export default RestoreWallet 