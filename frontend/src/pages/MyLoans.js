import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const MyLoans = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(0);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Load user's balance
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      setBalance(parseFloat(userBalance) || 0);

      // Load user's loans
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser && currentUser.loans) {
        setLoans(currentUser.loans);
      }
    }
  }, [user]);

  const handlePayEMI = async (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (loan.status === 'Closed') {
      showNotification('This loan is already closed', 'error');
      return;
    }

    if (balance < loan.emi) {
      showNotification('Insufficient balance to pay EMI', 'error');
      return;
    }

    setLoading(true);

    try {
      // Get current user data
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex === -1) {
        showNotification('User not found', 'error');
        setLoading(false);
        return;
      }

      // Update loan
      const loanIndex = users[userIndex].loans.findIndex(l => l.id === loanId);
      if (loanIndex === -1) {
        showNotification('Loan not found', 'error');
        setLoading(false);
        return;
      }

      const updatedLoan = users[userIndex].loans[loanIndex];
      updatedLoan.remainingAmount -= loan.emi;
      updatedLoan.emiPaid += 1;

      // Check if loan should be closed
      if (updatedLoan.remainingAmount <= 0) {
        updatedLoan.remainingAmount = 0;
        updatedLoan.status = 'Closed';
        updatedLoan.endDate = new Date().toISOString();
      }

      // Update user balance
      const newBalance = balance - loan.emi;
      users[userIndex].balance = newBalance;
      setBalance(newBalance);
      localStorage.setItem(`balance_${user.id}`, newBalance.toString());

      // Save updated users
      localStorage.setItem('users', JSON.stringify(users));

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      const emiTransaction = {
        id: Date.now().toString(),
        type: 'emi_payment',
        description: `EMI payment - ${updatedLoan.typeName}`,
        amount: loan.emi,
        loanId: loanId,
        date: new Date().toISOString(),
        status: 'completed'
      };
      transactions.unshift(emiTransaction);
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));

      // Update local state
      setLoans(users[userIndex].loans);

      if (updatedLoan.status === 'Closed') {
        showNotification(`EMI paid successfully! Loan has been closed.`, 'success');
      } else {
        showNotification(`EMI of ${formatCurrency(loan.emi)} paid successfully`, 'success');
      }

    } catch (error) {
      console.error('EMI payment error:', error);
      showNotification('Error processing EMI payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLoanStatusColor = (status) => {
    return status === 'Active' 
      ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
      : 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  };

  const totalOutstanding = loans
    .filter(loan => loan.status === 'Active')
    .reduce((sum, loan) => sum + loan.remainingAmount, 0);

  const totalMonthlyEMI = loans
    .filter(loan => loan.status === 'Active')
    .reduce((sum, loan) => sum + loan.emi, 0);

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
                  Total Loans
                </h3>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  {loans.length}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Outstanding
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Monthly EMI
                </h3>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(totalMonthlyEMI)}
                </p>
              </div>
            </Card>
          </div>

          {/* Action Button */}
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                My Loans
              </h2>
              <Button
                onClick={() => navigate('/apply-loan')}
                className="flex items-center space-x-2"
              >
                <span>+</span>
                <span>Apply for New Loan</span>
              </Button>
            </div>
          </Card>

          {/* Loans List */}
          {loans.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏦</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No Loans Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Apply for your first loan to get started
                </p>
                <Button onClick={() => navigate('/apply-loan')}>
                  Apply for Loan
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <Card key={loan.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Loan Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {loan.typeName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Loan ID: {loan.id}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLoanStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Principal:</span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {formatCurrency(loan.amount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {loan.interestRate}% p.a.
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Tenure:</span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {loan.tenure} months
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">EMI:</span>
                          <p className="font-semibold text-purple-600">
                            {formatCurrency(loan.emi)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(loan.remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">EMI Paid:</span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {loan.emiPaid} / {loan.tenure}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {formatDate(loan.startDate)}
                          </p>
                        </div>
                        {loan.endDate && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                              {formatDate(loan.endDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {loan.status === 'Active' && (
                        <Button
                          onClick={() => handlePayEMI(loan.id)}
                          loading={loading}
                          disabled={balance < loan.emi}
                          className="min-w-[120px]"
                        >
                          Pay EMI
                        </Button>
                      )}
                      {balance < loan.emi && loan.status === 'Active' && (
                        <p className="text-xs text-red-500 text-center">
                          Insufficient balance
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyLoans;
