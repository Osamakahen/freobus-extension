import React from 'react'

interface WelcomeProps {
  onGetStarted: () => void
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-hero">
          <div className="wallet-icon large" role="img" aria-label="Wallet icon" />
          <h1>Welcome to FreoBus Wallet</h1>
          <p className="subtitle">Your gateway to Web3 and decentralized applications</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div className="feature-text">
              <h3>Secure Storage</h3>
              <p>Your keys, your crypto - always encrypted and secure</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💳</span>
            <div className="feature-text">
              <h3>Easy Transactions</h3>
              <p>Send and receive crypto with just a few clicks</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌐</span>
            <div className="feature-text">
              <h3>Web3 Ready</h3>
              <p>Connect to dApps and explore the decentralized web</p>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-footer">
        <button 
          className="connect-button"
          onClick={onGetStarted}
        >
          Get Started
        </button>

        <p className="terms-notice">
          By continuing, you agree to our <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        </p>
      </div>
    </div>
  )
}

export default Welcome 