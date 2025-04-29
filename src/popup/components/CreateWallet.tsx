import React, { useState } from 'react'

interface CreateWalletProps {
  isCreating: boolean
  setIsCreating: (creating: boolean) => void
  error: string | null
  onCreateWallet: (password: string) => Promise<void>
}

const CreateWallet: React.FC<CreateWalletProps> = ({
  isCreating,
  error,
  onCreateWallet
}) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset validation error
    setValidationError(null)

    // Validate passwords
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

    // Call onCreateWallet with the password
    await onCreateWallet(password)
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

export default CreateWallet 