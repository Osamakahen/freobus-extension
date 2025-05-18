import React, { useState } from 'react'

interface WelcomeProps {
  onGetStarted: () => void
  onConnect?: () => void
}

const Welcome: React.FC<WelcomeProps> = ({
  onGetStarted,
  onConnect
}) => {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsChecking(true)
    setError(null)
    try {
      chrome.runtime.sendMessage({ type: 'checkWalletStatus' }, (response) => {
        if (response && response.isInitialized) {
          if (onConnect) onConnect()
        } else {
          setError('No existing wallet found. Please create a new wallet or restore an existing one.')
        }
        setIsChecking(false)
      });
    } catch (err) {
      setError('Failed to check wallet status. Please try again.')
      setIsChecking(false)
    }
  }

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        {/* <img src="icons/logo.png" alt="FreoWallet" className="logo" /> */}
        <h1>Welcome to FreoWallet</h1>
        <p className="subtitle">Your secure gateway to Web3</p>
        </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="action-buttons">
        {onConnect && (
          <button
            className="action-button primary"
            onClick={handleConnect}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Connect Wallet'}
          </button>
        )}
        <button 
          className="action-button secondary"
          onClick={onGetStarted}
        >
          Create New Wallet
        </button>
      </div>

      <div className="welcome-footer">
        <p className="security-note">
          🔒 Your keys, your crypto. We never store your seed phrase or private keys.
        </p>
      </div>
    </div>
  )
}

export default Welcome 