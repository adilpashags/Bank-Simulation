import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      const userTransactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      setTransactions(userTransactions);
      setFilteredTransactions(userTransactions);
    }
  }, [user]);

  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.type === filter || 
        (filter === 'received' && transaction.type === 'received')
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.toAccount?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.fromAccount?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [filter, searchTerm, transactions]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'withdraw':
        return '💸';
      case 'transfer':
        return '🏦';
      case 'received':
        return '📥';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'received':
        return 'text-green-600';
      case 'withdraw':
      case 'transfer':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Status'].join(','),
      ...filteredTransactions.map(t => [
        formatDate(t.date),
        t.type,
        t.description || '',
        t.amount,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${user.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
  };

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
        <Card title="Transaction History" className="mb-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
                <option value="transfer">Transfers Sent</option>
                <option value="received">Transfers Received</option>
              </select>
              <Button
                onClick={clearFilters}
                variant="secondary"
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
              <Button
                onClick={exportTransactions}
                variant="outline"
                className="whitespace-nowrap"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Deposits</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'deposit')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Total Withdrawals</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'withdraw')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Transfers Sent</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'transfer')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Received</p>
              <p className="text-xl font-bold text-purple-700">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === 'received')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start making transactions to see them here'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-500 mb-4">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {transaction.description}
                          </p>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>{formatDate(transaction.date)}</p>
                            {transaction.toAccount && (
                              <p>To: {transaction.toAccount}</p>
                            )}
                            {transaction.fromAccount && (
                              <p>From: {transaction.fromAccount}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'deposit' || transaction.type === 'received' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default TransactionHistory;
