import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatDate, calculateCreditScore, getCreditScoreCategory, calculateSpendingAnalytics, detectFraud, addFraudAlert } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

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
    loadUserData();
  }, [user]);

  const loadUserData = () => {
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
          setFraudAlerts(currentUser.fraudAlerts.slice(0, 5)); // Last 5 alerts
        }
        
        // Calculate monthly spending
        const analytics = calculateSpendingAnalytics(transactions, user.id);
        setMonthlySpending(analytics.incomeVsExpense.expense);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showNotification('Logged out successfully', 'success');
  };

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

  return (
    <>
      <Navigation />
      <div className="glass-container">
        <div className="glass-animate-in">
          {/* Welcome Header */}
          <Card className="glass-card mb-6">
            <div className="text-center">
              <h1 className="text-title">Welcome back, {user?.fullName || 'User'}!</h1>
              <p className="text-label">Here's your financial overview</p>
            </div>
          </Card>

          <div className="glass-grid">
            {/* Account Info */}
            <Card className="glass-card">
              <div className="text-center">
                <h3 className="text-title">Account Information</h3>
                <p className="text-label">Account: {user.accountNumber} | {user.accountType || 'Savings'} Account</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="glass-button"
              >
                Logout
              </Button>
            </Card>
          </div>

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
                <span className={`text-3xl font-bold ${
                  creditScore >= 750 ? 'text-green-600' :
                  creditScore >= 700 ? 'text-blue-600' :
                  creditScore >= 650 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {creditScore}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  creditScore >= 750 ? 'bg-green-100 text-green-800' :
                  creditScore >= 700 ? 'bg-blue-100 text-blue-800' :
                  creditScore >= 650 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {getCreditScoreCategory(creditScore).category}
                </span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/credit-score')}
              variant="outline"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </Card>

        {/* Balance Card */}
        <Card className="mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Current Balance</h2>
            <p className="text-5xl font-bold text-green-600 mb-4">
              {formatCurrency(balance)}
            </p>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Deposits</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === 'deposit')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Withdrawals</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === 'withdraw')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              onClick={() => navigate('/apply-loan')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-2xl">🏦</span>
              <span>Apply Loan</span>
            </Button>
            <Button
              onClick={() => navigate('/bill-payment')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-2xl">📄</span>
              <span>Pay Bills</span>
            </Button>
          </div>
        </Card>

        {/* Loan & Bill Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Loan Summary */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Loans</h3>
              <Button
                onClick={() => navigate('/loans')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            {loans.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No active loans</p>
                <Button
                  onClick={() => navigate('/apply-loan')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Loans:</span>
                  <span className="font-semibold">{loans.filter(l => l.status === 'Active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(
                      loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.remainingAmount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly EMI:</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(
                      loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.emi, 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Bills */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Bills</h3>
              <Button
                onClick={() => navigate('/bill-history')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            {recentBills.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No recent bills</p>
                <Button
                  onClick={() => navigate('/bill-payment')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Pay Bill
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBills.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{bill.categoryName}</p>
                      <p className="text-xs text-gray-500">{formatDate(bill.date)}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        {/* Recent Transactions */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Recent Transactions</h3>
            <Button
              onClick={() => navigate('/transaction-history')}
              variant="outline"
              size="sm"
            >
              View All
            </Button>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-2">
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'deposit' || transaction.type === 'received' ? '+' : '-'}
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
      
      {/* AI Assistant Widget */}

    </>
  );
};

export default Dashboard;
