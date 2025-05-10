import React from 'react'

interface WelcomeProps {
  onGetStarted: () => void
  onRestore: () => void
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted, onRestore }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-hero">
          <div className="wallet-icon large" role="img" aria-label="Wallet icon" />
          <h1>Welcome to <span className="brand-name">FreoWallet</span></h1>
          <p className="subtitle">Your Web3 MasterKey</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🛡️</span>
            <div className="feature-text">
              <h3>Secured</h3>
              <p>Military-grade encryption for your digital assets</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <div className="feature-text">
              <h3>Seamless</h3>
              <p>Effortless transactions and dApp interactions</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💎</span>
            <div className="feature-text">
              <h3>Rich</h3>
              <p>Premium features for the modern Web3 explorer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-footer">
        <button 
          type="button"
          className="connect-button"
          onClick={onGetStarted}
          aria-label="Get started with FreoBus Wallet"
        >
          Get Started
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onRestore}
          aria-label="Restore existing wallet"
          style={{ marginTop: 12 }}
        >
          Restore Wallet
        </button>
        <p className="terms-notice">
          By continuing, you agree to our <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        </p>
      </div>
    </div>
  )
}

export default Welcome 