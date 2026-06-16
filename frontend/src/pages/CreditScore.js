import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateCreditScore, getCreditScoreCategory, formatDate } from '../utils/helpers';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const CreditScore = () => {
  const { user } = useAuth();
  
  const [creditScore, setCreditScore] = useState(650);
  const [scoreCategory, setScoreCategory] = useState({});
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Calculate current credit score
      const score = calculateCreditScore(user);
      setCreditScore(score);
      setScoreCategory(getCreditScoreCategory(score));

      // Load credit history
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser && currentUser.creditHistory) {
        setCreditHistory(currentUser.creditHistory.slice(-10).reverse()); // Last 10 entries
      }
      
      setLoading(false);
    }
  }, [user]);

  const getScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 750) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 700) return 'bg-blue-100 dark:bg-blue-900/20';
    if (score >= 650) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getScoreProgress = (score) => {
    return ((score - 300) / 600) * 100; // Convert to percentage (300-900 range)
  };

  const getFactors = () => {
    const factors = [];
    const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const loans = user.loans || [];
    const activeLoans = loans.filter(loan => loan.status === 'Active');

    // Balance factor
    if (balance > 100000) {
      factors.push({ name: 'High Balance', impact: 'positive', icon: '💰' });
    } else if (balance < 5000) {
      factors.push({ name: 'Low Balance', impact: 'negative', icon: '⚠️' });
    }

    // Transaction activity
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    if (recentTransactions.length > 10) {
      factors.push({ name: 'Active Transactions', impact: 'positive', icon: '📈' });
    } else if (recentTransactions.length < 3) {
      factors.push({ name: 'Low Transaction Activity', impact: 'negative', icon: '📉' });
    }

    // Loan utilization
    if (activeLoans.length === 0) {
      factors.push({ name: 'No Active Loans', impact: 'positive', icon: '✅' });
    } else if (activeLoans.length > 2) {
      factors.push({ name: 'High Loan Utilization', impact: 'negative', icon: '🏦' });
    }

    // EMI payments
    const successfulEMIs = loans.reduce((sum, loan) => sum + (loan.emiPaid || 0), 0);
    if (successfulEMIs > 6) {
      factors.push({ name: 'Good EMI History', impact: 'positive', icon: '🎯' });
    }

    return factors;
  };

  const getTips = () => {
    const tips = [];
    const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const loans = user.loans || [];
    const activeLoans = loans.filter(loan => loan.status === 'Active');

    if (balance < 20000) {
      tips.push('Maintain a higher account balance to improve your credit score');
    }

    const recentTransactions = transactions.filter(t => 
      new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentTransactions.length < 5) {
      tips.push('Make regular transactions to show banking activity');
    }

    if (activeLoans.length > 0) {
      tips.push('Pay EMIs on time to build positive credit history');
    }

    if (creditScore < 700) {
      tips.push('Avoid applying for multiple loans in a short period');
    }

    return tips;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="dashboard-container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Calculating credit score...</p>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          {/* Credit Score Display */}
          <Card className="mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Your Credit Score
              </h2>
              
              <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full ${getScoreBgColor(creditScore)} mb-6`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(creditScore)}`}>
                    {creditScore}
                  </div>
                  <div className={`text-sm font-medium ${getScoreColor(creditScore)}`}>
                    {scoreCategory.category}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {scoreCategory.description}
              </p>

              {/* Score Range */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>300</span>
                  <span>900</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000"
                    style={{ width: `${getScoreProgress(creditScore)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-red-600">Poor</span>
                  <span className="text-yellow-600">Fair</span>
                  <span className="text-blue-600">Good</span>
                  <span className="text-green-600">Excellent</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Factors Affecting Score */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Factors Affecting Your Score
              </h3>
              <div className="space-y-3">
                {getFactors().map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{factor.icon}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {factor.name}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      factor.impact === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {factor.impact === 'positive' ? '+' : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips to Improve */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Tips to Improve Your Score
              </h3>
              <div className="space-y-3">
                {getTips().map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-600 mt-1">💡</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Credit History */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Recent Credit History
            </h3>
            {creditHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No credit history available yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {creditHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg ${
                        entry.impact === 'positive' ? 'text-green-600' : 
                        entry.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {entry.impact === 'positive' ? '📈' : 
                         entry.impact === 'negative' ? '📉' : '📊'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {entry.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      entry.scoreChange > 0 ? 'text-green-600' : 
                      entry.scoreChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {entry.scoreChange > 0 ? '+' : ''}{entry.scoreChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreditScore;
