import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  formatCurrency, 
  calculateSpendingAnalytics, 
  calculateFinancialHealthScore,
  generateFinancialAdvice 
} from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

const FinancialAdvisor = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [advice, setAdvice] = useState([]);
  const [healthScore, setHealthScore] = useState(50);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      const analyticsData = calculateSpendingAnalytics(transactions, user.id);
      const healthScoreData = calculateFinancialHealthScore(user);
      const adviceData = generateFinancialAdvice(user, analyticsData, healthScoreData);
      
      setAnalytics(analyticsData);
      setHealthScore(healthScoreData);
      setAdvice(adviceData);
    }
  }, [user]);

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getHealthScoreCategory = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  const handleDismissAdvice = (adviceId) => {
    // In a real app, this would mark advice as dismissed
    showNotification('Advice dismissed', 'info');
  };

  const handleActionAdvice = (adviceItem) => {
    setLoading(true);
    
    // Simulate taking action based on advice type
    setTimeout(() => {
      switch (adviceItem.type) {
        case 'savings':
          if (adviceItem.title.includes('Low Balance')) {
            showNotification('Consider setting up automatic savings transfers', 'info');
          } else if (adviceItem.title.includes('High Spending')) {
            showNotification('Budget recommendations have been sent to your email', 'success');
          }
          break;
        case 'loan':
          if (adviceItem.title.includes('High EMI')) {
            showNotification('Debt consolidation options are being calculated', 'info');
          } else if (adviceItem.title.includes('Excellent Credit')) {
            showNotification('Checking for better loan offers...', 'info');
          }
          break;
        case 'spending':
          if (adviceItem.title.includes('Bill Payments')) {
            showNotification('Bill optimization suggestions generated', 'success');
          } else if (adviceItem.title.includes('Withdrawals')) {
            showNotification('Digital payment setup guide sent', 'info');
          }
          break;
      }
      
      setLoading(false);
    }, 1500);
  };

  const highPriorityAdvice = advice.filter(a => a.priority === 'high');
  const mediumPriorityAdvice = advice.filter(a => a.priority === 'medium');
  const lowPriorityAdvice = advice.filter(a => a.priority === 'low');

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          {/* Financial Health Score */}
          <Card className="mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Financial Health Score
              </h2>
              
              <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full ${getHealthScoreColor(healthScore)} mb-6`}>
                <div className="text-center">
                  <div className="text-5xl font-bold">
                    {healthScore}
                  </div>
                  <div className="text-sm font-medium">
                    {getHealthScoreCategory(healthScore)}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {healthScore >= 80 ? 'Excellent financial health! Keep up the great work.' :
                 healthScore >= 60 ? 'Good financial health with room for improvement.' :
                 healthScore >= 40 ? 'Fair financial health. Consider reviewing your spending habits.' :
                 'Poor financial health. Immediate action recommended.'}
              </p>

              {/* Health Score Factors */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Balance Level
                  </h4>
                  <div className={`w-full h-2 rounded-full ${
                    healthScore >= 60 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Savings Ratio
                  </h4>
                  <div className={`w-full h-2 rounded-full ${
                    healthScore >= 50 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Credit Score
                  </h4>
                  <div className={`w-full h-2 rounded-full ${
                    user.creditScore >= 700 ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Loan Burden
                  </h4>
                  <div className={`w-full h-2 rounded-full ${
                    healthScore >= 40 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Financial Advisor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* High Priority Advice */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="text-red-600 mr-2">🚨</span>
                High Priority
              </h3>
              <div className="space-y-3">
                {highPriorityAdvice.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No high priority issues detected
                    </p>
                  </div>
                ) : (
                  highPriorityAdvice.map((adviceItem, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getPriorityColor(adviceItem.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{adviceItem.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            {adviceItem.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {adviceItem.description}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleActionAdvice(adviceItem)}
                              loading={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Take Action
                            </Button>
                            <Button
                              onClick={() => handleDismissAdvice(adviceItem.id)}
                              variant="outline"
                              size="sm"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Medium Priority Advice */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                Medium Priority
              </h3>
              <div className="space-y-3">
                {mediumPriorityAdvice.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No medium priority issues
                    </p>
                  </div>
                ) : (
                  mediumPriorityAdvice.map((adviceItem, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getPriorityColor(adviceItem.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{adviceItem.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            {adviceItem.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {adviceItem.description}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleActionAdvice(adviceItem)}
                              loading={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Take Action
                            </Button>
                            <Button
                              onClick={() => handleDismissAdvice(adviceItem.id)}
                              variant="outline"
                              size="sm"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Low Priority & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Priority Advice */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="text-blue-600 mr-2">💡</span>
                Recommendations
              </h3>
              <div className="space-y-3">
                {lowPriorityAdvice.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No additional recommendations at this time
                    </p>
                  </div>
                ) : (
                  lowPriorityAdvice.map((adviceItem, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getPriorityColor(adviceItem.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{adviceItem.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            {adviceItem.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {adviceItem.description}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleActionAdvice(adviceItem)}
                              loading={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Learn More
                            </Button>
                            <Button
                              onClick={() => handleDismissAdvice(adviceItem.id)}
                              variant="outline"
                              size="sm"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Financial Tips */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <span className="text-green-600 mr-2">📚</span>
                Financial Tips
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    🎯 Set Financial Goals
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Define clear short-term and long-term financial goals to stay motivated and track progress effectively.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    📊 Track Expenses Regularly
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Monitor your spending patterns to identify areas where you can cut costs and save more.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
                    🛡️ Build Emergency Fund
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Maintain 3-6 months of expenses as emergency fund for financial security.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    💰 Automate Savings
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Set up automatic transfers to savings account right after payday to ensure consistent saving.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialAdvisor;
