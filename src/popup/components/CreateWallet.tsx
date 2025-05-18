import React, { useState } from 'react'
import SeedPhraseBackupModal from './SeedPhraseBackupModal'

interface CreateWalletProps {
  onBack: () => void
  onWalletCreated: (walletState: any) => void
}

const CreateWallet: React.FC<CreateWalletProps> = ({ onBack, onWalletCreated }) => {
  const [step, setStep] = useState<'password' | 'seed' | 'confirm'>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: "generate_mnemonic" 
      })
      
      if (response.success) {
        setMnemonic(response.mnemonic)
        setStep('seed')
      } else {
        setError('Failed to generate wallet. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedConfirm = async () => {
    setIsLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({
        action: "create_wallet",
        password,
        mnemonic
      })

      if (response.success) {
        console.log("Wallet created, calling onWalletCreated");
        onWalletCreated(response.walletState);
      } else {
        setError('Failed to create wallet. Please try again.')
        setStep('password')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setStep('password')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'password') {
    return (
      <div className="create-wallet-container card">
        <div className="accent-bar" />
        <h2>Create New Wallet</h2>
        <form onSubmit={handlePasswordSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password (min. 8 characters)"
              disabled={isLoading}
              required
              minLength={8}
            />
            <small>This password will be used to protect your wallet</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter the same password again"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          <div className="button-group">
            <button 
              type="button"
              onClick={onBack}
              className="secondary-button"
              disabled={isLoading}
            >
              Back
            </button>
          <button 
            type="submit"
              disabled={isLoading}
              className="primary-button"
          >
              {isLoading ? 'Creating...' : 'Create Wallet'}
          </button>
          </div>
        </form>
      </div>
    )
  }

  if (step === 'seed') {
    return (
      <SeedPhraseBackupModal
        mnemonic={mnemonic}
        onConfirm={handleSeedConfirm}
        onBack={() => setStep('password')}
        isLoading={isLoading}
      />
    )
  }

  return null
}

export default CreateWallet 