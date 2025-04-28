import { useState } from 'react'
import { walletService } from '../shared/services/wallet'
import "./style.css"

const Onboarding = () => {
  const [step, setStep] = useState<'welcome' | 'create' | 'success'>('welcome')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await walletService.createWallet(password)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-container">
      {step === "welcome" && (
        <div className="welcome-screen">
          <h1>Welcome to FreoBus Wallet</h1>
          <p>Your gateway to Web3 and decentralized applications</p>
          <button onClick={() => setStep("create")} className="primary-button">
            Get Started
          </button>
        </div>
      )}

      {step === "create" && (
        <div className="create-screen">
          <h1>Create Your Wallet</h1>
          <p>Set a strong password to protect your wallet</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>

          <button onClick={handleCreateWallet} className="primary-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="success-screen">
          <h1>Wallet Created!</h1>
          <p>Your FreoBus Wallet is ready to use</p>
          <p>You can now close this tab and start using your wallet</p>
        </div>
      )}
    </div>
  )
}

export default Onboarding 