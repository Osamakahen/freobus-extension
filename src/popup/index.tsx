import './style.css'
import './styles/WalletContent.css'
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import CreateWallet from './components/CreateWallet';
import WalletContent from './components/WalletContent';
import UnlockWalletModal from './components/UnlockWalletModal';
import RestoreWallet from './components/RestoreWallet';

const containerStyle: React.CSSProperties = {
  minHeight: "320px",
  minWidth: "320px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  background: "#fff",
  fontFamily: "Inter, Arial, sans-serif",
  padding: 0
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "18px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  width: "340px",
  maxWidth: "90vw",
  height: "480px",
  minHeight: "420px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 0,
  overflow: "hidden",
  position: "relative"
};

const accentBarStyle: React.CSSProperties = {
  width: '100%',
  height: 5,
  background: 'linear-gradient(90deg, #43e97b 0%, #f9d423 100%)',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  position: 'absolute',
  top: 0,
  left: 0
};

const logoSectionStyle: React.CSSProperties = {
  width: "100%",
  height: "34%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  borderTopLeftRadius: "18px",
  borderTopRightRadius: "18px"
};

const logoStyle: React.CSSProperties = {
  width: "120px",
  height: "120px",
  objectFit: "contain",
  display: "block",
  animation: "logoIn 0.8s cubic-bezier(.68,-0.55,.27,1.55)"
};

const subtitleSectionStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const subtitleStyle: React.CSSProperties = {
  color: "#008080",
  fontWeight: 600,
  fontSize: "1.5rem",
  textAlign: "center",
  letterSpacing: 0.2
};

const buttonContainerStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: "2em"
};

const buttonStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #FFD700 0%, #FFC300 100%)",
  color: "#333",
  border: "none",
  borderRadius: "18px",
  padding: "0.8em 0",
  fontWeight: 700,
  fontSize: "1.05rem",
  margin: "0.5em 0",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(249, 212, 35, 0.10)",
  transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "75%",
  maxWidth: 240,
  minWidth: 120,
  outline: "none"
};

const buttonHoverStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #FFC300 0%, #FFD700 100%)",
  boxShadow: "0 4px 16px rgba(249, 212, 35, 0.18)",
  transform: "translateY(-2px)"
};

const forgotStyle: React.CSSProperties = {
  color: "#1976d2",
  fontSize: "0.95em",
  textAlign: "center",
  marginTop: "0.5em",
  cursor: "pointer",
  textDecoration: "underline"
};

const trustBadgeStyle: React.CSSProperties = {
  fontSize: '0.95em',
  color: '#008080',
  marginTop: 8,
  marginBottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  justifyContent: 'center',
  fontWeight: 500
};

function useButtonHover() {
  const [hover, setHover] = React.useState(false);
  const onMouseEnter = () => setHover(true);
  const onMouseLeave = () => setHover(false);
  return { hover, onMouseEnter, onMouseLeave };
}

// Add keyframes for logo animation
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
@keyframes logoIn {
  0% { opacity: 0; transform: translateY(-30px) scale(0.9);}
  100% { opacity: 1; transform: translateY(0) scale(1);}
}`;
document.head.appendChild(styleSheet);

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 6}}>
    <rect x="3" y="7" width="18" height="10" rx="3" fill="#008080" stroke="#FFD700" strokeWidth="2"/>
    <circle cx="17" cy="12" r="1.5" fill="#FFD700" stroke="#fff" strokeWidth="1"/>
  </svg>
);
const KeyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 6}}>
    <circle cx="15" cy="9" r="3" fill="#008080" stroke="#FFD700" strokeWidth="2"/>
    <rect x="2" y="15" width="10" height="3" rx="1.5" fill="#008080" stroke="#FFD700" strokeWidth="2"/>
    <circle cx="6" cy="16.5" r="1" fill="#FFD700" stroke="#fff" strokeWidth="1"/>
  </svg>
);

const Welcome = () => {
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showWalletDashboard, setShowWalletDashboard] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showRestoreWallet, setShowRestoreWallet] = useState(false);
  const [walletState, setWalletState] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleConnect = () => {
    setShowUnlock(true);
  };

  const handleUnlock = async (password: string) => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'unlock_wallet', password });
      if (response && response.success && response.walletState) {
        setWalletState(response.walletState);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUnlockSuccess = () => {
    setShowUnlock(false);
    setShowWalletDashboard(true);
  };

  const handleCreate = () => {
    setShowCreateWallet(true);
  };

  const handleWalletCreated = (state: any) => {
    setShowCreateWallet(false);
    setWalletState(state);
    setShowWalletDashboard(true);
  };

  const handleForgot = () => {
    setShowUnlock(false);
    setShowRestoreWallet(true);
  };

  const handleRestore = async (password: string, mnemonic: string) => {
    setRestoreError(null);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'create_wallet', mnemonic, password });
      if (response && response.success && response.walletState) {
        setWalletState(response.walletState);
        setShowRestoreWallet(false);
        setShowWalletDashboard(true);
      } else {
        setRestoreError(response?.error || 'Failed to restore wallet');
      }
    } catch (err: any) {
      setRestoreError(err?.message || 'Failed to restore wallet');
    }
  };

  const logoUrl = chrome.runtime.getURL('icons/logo.svg');
  const connectBtn = useButtonHover();
  const createBtn = useButtonHover();

  if (showWalletDashboard) {
    return <WalletContent selectedAccount={walletState?.accounts?.[0] || null} selectedNetwork={walletState?.selectedNetwork || null} />;
  }

  if (showUnlock) {
    return <UnlockWalletModal onUnlock={handleUnlock} onForgot={handleForgot} onSuccess={handleUnlockSuccess} />;
  }

  if (showCreateWallet) {
    return <CreateWallet onBack={() => setShowCreateWallet(false)} onWalletCreated={handleWalletCreated} />;
  }

  if (showRestoreWallet) {
    return <RestoreWallet onRestore={handleRestore} error={restoreError} />;
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={accentBarStyle} />
        <div style={logoSectionStyle}>
          <img src={logoUrl} alt="FreoWallet Logo" style={logoStyle} />
        </div>
        <div style={subtitleSectionStyle}>
          <div style={subtitleStyle}>Your MasterKey</div>
        </div>
        <div style={buttonContainerStyle}>
          <button
            style={connectBtn.hover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
            onClick={handleConnect}
            onMouseEnter={connectBtn.onMouseEnter}
            onMouseLeave={connectBtn.onMouseLeave}
          >
            <WalletIcon /> Connect Wallet
          </button>
          <div style={forgotStyle} onClick={handleForgot}>Forgot your password?</div>
          <button
            style={createBtn.hover ? { ...buttonStyle, ...buttonHoverStyle, marginTop: "2em" } : { ...buttonStyle, marginTop: "2em" }}
            onClick={handleCreate}
            onMouseEnter={createBtn.onMouseEnter}
            onMouseLeave={createBtn.onMouseLeave}
          >
            <KeyIcon /> Create Wallet
              </button>
          <div style={trustBadgeStyle}>
            <span role="img" aria-label="lock">🔒</span> Non-custodial & private
          </div>
        </div>
            </div>
    </div>
  );
};

const plasmoRoot = document.getElementById("__plasmo");
if (plasmoRoot) {
  createRoot(plasmoRoot).render(<Welcome />);
}

export {} 