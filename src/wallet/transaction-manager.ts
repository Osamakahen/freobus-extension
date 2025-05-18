import { EventEmitter } from 'events';
import type { Transaction, TransactionStatus } from '../shared/types/wallet';

export class TransactionManager extends EventEmitter {
  private transactions: Map<string, TransactionStatus>;

  constructor() {
    super();
    this.transactions = new Map();
  }

  public async addTransaction(transaction: Transaction): Promise<void> {
    const status: TransactionStatus = {
      hash: transaction.hash || '',
      status: 'pending',
      timestamp: Date.now() / 1000
    };

    this.transactions.set(transaction.hash || '', status);
    this.emit('transactionAdded', { transaction, status });

    // Store in chrome.storage
    const storedTransactions = await this.getStoredTransactions(transaction.from);
    storedTransactions.push({
      ...transaction,
      status: 'pending',
      timestamp: status.timestamp
    });

    await this.saveTransactions(transaction.from, storedTransactions);
  }

  public async updateTransactionStatus(
    hash: string,
    status: 'confirmed' | 'failed',
    blockNumber?: number
  ): Promise<void> {
    const currentStatus = this.transactions.get(hash);
    if (!currentStatus) return;

    const updatedStatus: TransactionStatus = {
      ...currentStatus,
      status,
      blockNumber,
      timestamp: Date.now() / 1000
    };

    this.transactions.set(hash, updatedStatus);
    this.emit('transactionUpdated', { hash, status: updatedStatus });

    // Update in chrome.storage
    const storedTransactions = await this.getStoredTransactions(currentStatus.from || '');
    const updatedTransactions = storedTransactions.map(tx => 
      tx.hash === hash ? { ...tx, status, blockNumber, timestamp: updatedStatus.timestamp } : tx
    );

    await this.saveTransactions(currentStatus.from || '', updatedTransactions);
  }

  private async getStoredTransactions(address: string): Promise<Transaction[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['transactions'], (result) => {
        const storedTransactions = result.transactions || {};
        resolve(storedTransactions[address] || []);
      });
    });
  }

  private async saveTransactions(address: string, transactions: Transaction[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['transactions'], (result) => {
        const storedTransactions = result.transactions || {};
        storedTransactions[address] = transactions;
        chrome.storage.local.set({ transactions: storedTransactions }, resolve);
      });
    });
  }

  public getTransactionStatus(hash: string): TransactionStatus | undefined {
    return this.transactions.get(hash);
  }

  public cleanup(): void {
    this.transactions.clear();
  }
} 