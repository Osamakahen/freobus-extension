import React, { useState } from 'react'
import { ethers } from 'ethers'
import SeedPhraseBackupModal from './SeedPhraseBackupModal'

interface CreateWalletProps {
  isCreating: boolean
  setIsCreating: (creating: boolean) => void
  error: string | null
  onCreateWallet: (password: string, mnemonic: string) => Promise<void>
}

const CreateWallet: React.FC<CreateWalletProps> = ({
  isCreating,
  error,
  onCreateWallet
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [step, setStep] = useState<'password' | 'show' | 'confirm'>('password')
  const [mnemonic, setMnemonic] = useState<string>('')
  const [showBackupModal, setShowBackupModal] = useState(false)

  // Generate mnemonic after password is set
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
    // Generate mnemonic
    const wallet = ethers.Wallet.createRandom()
    setMnemonic(wallet.mnemonic.phrase)
    setStep('show')
    setShowBackupModal(true)
  }

  if (step === 'password') {
    return (
      <div className="popup-content">
        <form onSubmit={handlePasswordSubmit}>
          {(error || validationError) && (
            <div className="error-message" role="alert">
              {error || validationError}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password (min. 8 characters)"
              disabled={isCreating}
              required
              minLength={8}
            />
            <small className="input-help">This password will be used to protect your wallet</small>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter the same password again"
              disabled={isCreating}
              required
              minLength={8}
            />
          </div>
          <button 
            className={`connect-button ${isCreating ? 'loading' : ''}`}
            type="submit"
            disabled={isCreating}
            aria-busy={isCreating}
          >
            {isCreating ? 'Creating Wallet...' : 'Create New Wallet'}
          </button>
        </form>
      </div>
    )
  }

  if (showBackupModal && mnemonic) {
    return <SeedPhraseBackupModal mnemonic={mnemonic} onConfirm={async () => {
      setShowBackupModal(false);
      await onCreateWallet(password, mnemonic);
    }} />
  }

  return null
}

export default CreateWallet 