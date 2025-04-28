import React from 'react'

interface CreateWalletProps {
  isCreating: boolean
  setIsCreating: (creating: boolean) => void
  error: string | null
  onCreateWallet: () => Promise<void>
}

const CreateWallet: React.FC<CreateWalletProps> = ({
  isCreating,
  error,
  onCreateWallet
}) => {
  return (
    <div className="popup-content">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      <button 
        className={`connect-button ${isCreating ? 'loading' : ''}`}
        onClick={onCreateWallet}
        disabled={isCreating}
        aria-busy={isCreating}
        type="button"
      >
        {isCreating ? 'Creating Wallet...' : 'Create New Wallet'}
      </button>
    </div>
  )
}

export default CreateWallet 