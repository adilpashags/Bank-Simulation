import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatDate, calculateCreditScore, getCreditScoreCategory, calculateSpendingAnalytics, detectFraud, addFraudAlert } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [creditScore, setCreditScore] = useState(650);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState(0);

  useEffect(() => {
    if (user) {
      // Load user's balance from localStorage
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      if (userBalance) {
        setBalance(parseFloat(userBalance));
      } else {
        // Set default balance for existing users without balance
        const defaultBalance = 100000;
        setBalance(defaultBalance);
        localStorage.setItem(`balance_${user.id}`, defaultBalance.toString());
      }
      
      // Load user's transactions from localStorage
      const userTransactions = localStorage.getItem(`transactions_${user.id}`);
      if (userTransactions) {
        const allTransactions = JSON.parse(userTransactions);
        setTransactions(allTransactions);
        // Get last 5 transactions for dashboard
        setRecentTransactions(allTransactions.slice(0, 5));
      }
      
      // Load user's loans
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser) {
        setLoans(currentUser.loans || []);
        
        // Get recent bills (last 3)
        if (currentUser.bills) {
          setRecentBills(currentUser.bills.slice(0, 3));
        }
        
        // Calculate credit score
        const score = calculateCreditScore(currentUser);
        setCreditScore(score);
        
        // Load fraud alerts
        if (currentUser.fraudAlerts) {
          setFraudAlerts(currentUser.fraudAlerts.slice(0, 5));
        }
        
        // Calculate monthly spending
        const analytics = calculateSpendingAnalytics(allTransactions, user.id);
        setMonthlySpending(analytics.incomeVsExpense.expense);
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    showNotification('Logged out successfully', 'success');
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'loan_credit':
        return '💰';
      case 'withdraw':
      case 'transfer':
        return '💸';
      case 'bill_payment':
        return '📄';
      case 'emi_payment':
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
      case 'loan_credit':
      case 'received':
        return 'text-green-600';
      case 'withdraw':
      case 'transfer':
      case 'bill_payment':
      case 'emi_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreCategory = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Dashboard" actions={
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/analytics')}
              variant="outline"
              size="sm"
            >
              📊 Analytics
            </Button>
            <Button
              onClick={() => navigate('/fraud-monitor')}
              variant="outline"
              size="sm"
            >
              🛡️ Security
            </Button>
          </div>
        } />
        
        <div className="p-6">
          {/* Welcome Header */}
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome back, {user?.fullName}! 👋
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Account: {user.accountNumber} | {user.accountType || 'Savings'} Account
                </p>
              </div>
            </div>
          </Card>

          {/* Fraud Alert Widget */}
          {fraudAlerts.length > 0 && (
            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-red-600">
                    🚨 Fraud Alert{fraudAlerts.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {fraudAlerts.length} suspicious transaction{fraudAlerts.length > 1 ? 's' : ''} detected
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/fraud-monitor')}
                  variant="danger"
                  size="sm"
                >
                  Review Now
                </Button>
              </div>
            </Card>
          )}

          {/* Monthly Spending Summary */}
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Monthly Spending
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(monthlySpending)}
                </p>
              </div>
              <Button
                onClick={() => navigate('/analytics')}
                variant="outline"
                size="sm"
              >
                  View Analytics
                </Button>
            </div>
          </Card>

          {/* Credit Score Widget */}
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Credit Score
                </h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`text-3xl font-bold ${getCreditScoreColor(creditScore)}`}>
                    {creditScore}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCreditScoreColor(creditScore)}`}>
                    {getCreditScoreCategory(creditScore)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Balance Card */}
          <Card className="mb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Balance</h2>
              <p className="text-5xl font-bold text-green-600 mb-4">
                {formatCurrency(balance)}
              </p>
              <div className="flex justify-center space-x-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Deposits</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(
                      transactions
                        .filter(t => t.type === 'deposit' || t.type === 'loan_credit')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawals</p>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(
                      transactions
                        .filter(t => t.type === 'withdraw')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  )}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h3>
            <div className="grid grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/transactions')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">💰</span>
                <span>Deposit</span>
              </Button>
              <Button
                onClick={() => navigate('/transactions')}
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">💸</span>
                <span>Withdraw</span>
              </Button>
              <Button
                onClick={() => navigate('/loans')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">🏦</span>
                <span>Loans</span>
              </Button>
              <Button
                onClick={() => navigate('/bill-payment')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <span className="text-2xl">📄</span>
                <span>Bills</span>
              </Button>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Transactions</h3>
              <Button
                onClick={() => navigate('/transaction-history')}
                variant="outline"
                size="sm"
              >
                  View All
                </Button>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No transactions yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start making transactions to see them here
                </p>
                <Button
                  onClick={() => navigate('/transactions')}
                  className="mt-4"
                >
                  Make Your First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'deposit' || transaction.type === 'loan_credit' || transaction.type === 'received' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
