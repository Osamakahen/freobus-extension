import React, { useState } from "react"
import "./style.css"

const Popup = () => {
  const [accounts, setAccounts] = useState<string[]>([])
  const [balance, setBalance] = useState<string>("0")
  const [isConnected, setIsConnected] = useState(false)

  const connectWallet = async () => {
    try {
      // TODO: Implement wallet connection
      setIsConnected(true)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = async () => {
    try {
      // TODO: Implement wallet disconnection
      setIsConnected(false)
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="wallet-icon" />
        <h1>FreoBus</h1>
      </header>

      <main className="popup-content">
        {!isConnected ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <div className="account-section">
              <h2>Accounts</h2>
              {accounts.map((account) => (
                <div key={account} className="account-item">
                  {account}
                </div>
              ))}
            </div>
            <div className="balance-section">
              <h2>Balance</h2>
              <p>{balance} ETH</p>
            </div>
            <button onClick={disconnectWallet} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Popup 