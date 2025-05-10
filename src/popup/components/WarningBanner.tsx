import React from 'react';

interface WarningBannerProps {
  type?: 'info' | 'warning' | 'danger';
  icon?: React.ReactNode;
  message: React.ReactNode;
  actions?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const typeStyles = {
  info: { background: '#e3f2fd', color: '#1565c0', icon: 'ℹ️' },
  warning: { background: '#fff3cd', color: '#856404', icon: '⚠️' },
  danger: { background: '#f8d7da', color: '#721c24', icon: '⛔' },
};

const WarningBanner: React.FC<WarningBannerProps> = ({
  type = 'warning',
  icon,
  message,
  actions,
  dismissible = false,
  onDismiss,
}) => {
  const style = typeStyles[type];
  return (
    <div
      className="warning-banner"
      style={{
        background: style.background,
        color: style.color,
        padding: '12px 16px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        marginBottom: 12,
        fontWeight: 500,
        fontSize: 15,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      role="alert"
    >
      <span style={{ fontSize: 22, marginRight: 12 }}>{icon || style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {actions && <span style={{ marginLeft: 16 }}>{actions}</span>}
      {dismissible && (
        <button
          onClick={onDismiss}
          style={{ marginLeft: 16, background: 'none', border: 'none', color: style.color, fontSize: 18, cursor: 'pointer' }}
          aria-label="Dismiss warning"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default WarningBanner; 