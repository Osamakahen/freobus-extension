import React from 'react';
import { Transaction, TransactionStatus } from '../../shared/types/wallet';

interface TransactionHistoryProps {
  transactions: Transaction[];
  selectedNetwork: { currencySymbol: string } | null;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, selectedNetwork }) => {
  const formatAmount = (value: string) => {
    const amount = parseFloat(value) / 1e18; // Convert from wei to ETH
    return amount.toFixed(6);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: TransactionStatus['status']) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="transaction-history-empty">
        <div className="empty-state-icon">📝</div>
        <p>No transactions yet</p>
        <small>Your transaction history will appear here</small>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      {transactions.map((tx) => (
        <div key={tx.hash} className="transaction-item">
          <div className="transaction-icon">
            {tx.from === tx.to ? '↻' : '↑'}
          </div>
          <div className="transaction-details">
            <div className="transaction-header">
              <span className="transaction-type">
                {tx.from === tx.to ? 'Self' : 'Send'}
              </span>
              <span className="transaction-amount">
                {formatAmount(tx.value.toString())} {selectedNetwork?.currencySymbol || 'ETH'}
              </span>
            </div>
            <div className="transaction-footer">
              <span className="transaction-date">
                {formatDate(tx.timestamp || Date.now() / 1000)}
              </span>
              <span 
                className="transaction-status"
                style={{ color: getStatusColor(tx.status || 'pending') }}
              >
                {tx.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory; 