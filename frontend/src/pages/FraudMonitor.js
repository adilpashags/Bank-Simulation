import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Navigation from '../components/Navigation';

const FraudMonitor = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Load user's fraud alerts
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser && currentUser.fraudAlerts) {
        setFraudAlerts(currentUser.fraudAlerts);
      }
    }
  }, [user]);

  const filteredAlerts = fraudAlerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const handleReviewAlert = (alertId) => {
    setLoading(true);
    
    // Update alert status to 'reviewed'
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      const alertIndex = users[userIndex].fraudAlerts.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        users[userIndex].fraudAlerts[alertIndex].status = 'reviewed';
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update local state
        const updatedAlerts = [...fraudAlerts];
        const localAlertIndex = updatedAlerts.findIndex(a => a.id === alertId);
        if (localAlertIndex !== -1) {
          updatedAlerts[localAlertIndex].status = 'reviewed';
          setFraudAlerts(updatedAlerts);
        }
        
        showNotification('Alert marked as reviewed', 'success');
      }
    }
    
    setLoading(false);
  };

  const handleResolveAlert = (alertId) => {
    setLoading(true);
    
    // Update alert status to 'resolved'
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      const alertIndex = users[userIndex].fraudAlerts.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        users[userIndex].fraudAlerts[alertIndex].status = 'resolved';
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update local state
        const updatedAlerts = [...fraudAlerts];
        const localAlertIndex = updatedAlerts.findIndex(a => a.id === alertId);
        if (localAlertIndex !== -1) {
          updatedAlerts[localAlertIndex].status = 'resolved';
          setFraudAlerts(updatedAlerts);
        }
        
        showNotification('Alert marked as resolved', 'success');
      }
    }
    
    setLoading(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'flagged': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'reviewed': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getFlagIcon = (flagType) => {
    switch (flagType) {
      case 'high_amount': return '💰';
      case 'rapid_transactions': return '⚡';
      case 'multiple_transfers': return '🔄';
      case 'low_balance_withdrawal': return '📉';
      case 'unusual_spike': return '📈';
      default: return '⚠️';
    }
  };

  const highRiskAlerts = fraudAlerts.filter(a => a.severity === 'high').length;
  const mediumRiskAlerts = fraudAlerts.filter(a => a.severity === 'medium').length;

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Alerts
                </h3>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  {fraudAlerts.length}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  High Risk
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {highRiskAlerts}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Medium Risk
                </h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {mediumRiskAlerts}
                </p>
              </div>
            </Card>
          </div>

          {/* Fraud Alerts List */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Fraud Alerts
              </h2>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Alerts</option>
                  <option value="flagged">Flagged</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No Fraud Alerts
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your account shows no suspicious activity
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getFlagIcon(alert.flags[0]?.type)}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()} RISK
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            Suspicious Transaction Detected
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(alert.date)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Transaction Details:
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-600">Type:</span> {alert.transaction.type}</p>
                          <p><span className="text-gray-600">Amount:</span> {formatCurrency(alert.transaction.amount)}</p>
                          {alert.transaction.toAccount && (
                            <p><span className="text-gray-600">To:</span> {alert.transaction.toAccount}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fraud Flags:
                        </h4>
                        <div className="space-y-2">
                          {alert.flags.map((flag, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-red-500">⚠️</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                {flag.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {alert.status === 'flagged' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          onClick={() => handleReviewAlert(alert.id)}
                          loading={loading}
                          variant="secondary"
                          size="sm"
                        >
                          Mark as Reviewed
                        </Button>
                        <Button
                          onClick={() => handleResolveAlert(alert.id)}
                          loading={loading}
                          variant="outline"
                          size="sm"
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
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

export default FraudMonitor;
