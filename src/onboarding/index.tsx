import React, { useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import "./style.css"

const Onboarding = () => {
  const [step, setStep] = useState<"welcome" | "create" | "success">("welcome")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      const response = await sendToBackground({
        name: "wallet",
        body: {
          type: "CREATE_WALLET",
          payload: { password }
        }
      })

      if (response.success) {
        setStep("success")
      } else {
        setError(response.error || "Failed to create wallet")
      }
    } catch (err) {
      setError("Failed to create wallet")
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

          <button onClick={handleCreateWallet} className="primary-button">
            Create Wallet
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