import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  calculateEMI, 
  getLoanTypes, 
  generateLoanId, 
  formatCurrency,
  checkLoanEligibility,
  calculateCreditScore,
  updateCreditHistory
} from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

// Loan configurations with safe defaults
const loanConfigs = {
  personal: { maxAmount: 500000, interest: 12 },
  home: { maxAmount: 5000000, interest: 8 },
  car: { maxAmount: 1000000, interest: 9 },
  education: { maxAmount: 2000000, interest: 7 },
  gold: { maxAmount: 300000, interest: 10 },
  business: { maxAmount: 1000000, interest: 13 }
};

const ApplyLoan = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [emi, setEmi] = useState(0);
  const [errors, setErrors] = useState({});
  const [loanDetails, setLoanDetails] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  // Handle pre-filled data from EMI planner
  useEffect(() => {
    if (location.state?.loanType) {
      setSelectedLoanType(location.state.loanType);
      setLoanAmount(location.state.amount || '');
      setTenure(location.state.tenure || '');
    }
  }, [location]);

  const loanTypes = getLoanTypes();

  useEffect(() => {
    if (user) {
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      setBalance(parseFloat(userBalance) || 0);
    }
  }, [user]);

  useEffect(() => {
    if (selectedLoanType && loanAmount && tenure) {
      const loanType = loanTypes.find(lt => lt.type === selectedLoanType);
      if (loanType) {
        const calculatedEmi = calculateEMI(
          parseFloat(loanAmount), 
          loanType?.rate || 0, // Safe access with fallback
          parseInt(tenure)
        );
        setEmi(calculatedEmi);
        
        // Check eligibility when all fields are filled
        if (user) {
          const eligibility = checkLoanEligibility(user, parseFloat(loanAmount), selectedLoanType);
          setEligibilityResult(eligibility || {}); // Safe: use empty object instead of null
        }
      }
    } else {
      setEmi(0);
      setEligibilityResult({}); // Safe: use empty object instead of null
    }
  }, [selectedLoanType, loanAmount, tenure, user]);

  const handleLoanTypeChange = (type) => {
    setSelectedLoanType(type);
    setLoanAmount('');
    setTenure('');
    setEmi(0);
    setErrors({});
    
    const loanType = loanTypes.find(lt => lt.type === type);
    setLoanDetails(loanType);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedLoanType) {
      newErrors.loanType = 'Please select a loan type';
    }
    
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    }
    
    if (loanDetails) {
      const amount = parseFloat(loanAmount);
      if (amount < loanDetails?.minAmount) {
        newErrors.amount = `Minimum amount is ${formatCurrency(loanDetails?.minAmount)}`;
      }
      if (amount > loanDetails?.maxAmount) {
        newErrors.amount = `Maximum amount is ${formatCurrency(loanDetails?.maxAmount)}`;
      }
    }
    
    if (!tenure || parseInt(tenure) <= 0) {
      newErrors.tenure = 'Please enter a valid tenure';
    }
    
    if (parseInt(tenure) > 360) {
      newErrors.tenure = 'Maximum tenure is 360 months (30 years)';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Check eligibility before proceeding
    if (!eligibilityResult?.isEligible) {
      showNotification('You are not eligible for this loan', 'error');
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

      // Determine approval outcome based on risk assessment
      const creditScore = calculateCreditScore(user);
      let approvedAmount = parseFloat(loanAmount);
      let approvalStatus = 'Approved';
      let approvalMessage = 'Loan approved!';
      
      // Risk-based approval logic
      if (creditScore < 700) {
        approvedAmount = eligibilityResult?.maxAmount || 0;
        if (approvedAmount < parseFloat(loanAmount)) {
          approvalStatus = 'Conditionally Approved';
          approvalMessage = `Loan conditionally approved! Amount reduced to ${formatCurrency(approvedAmount)}`;
        }
      }
      
      if (creditScore < 650 || !eligibilityResult?.isEligible) {
        approvalStatus = 'Rejected';
        approvalMessage = 'Loan application rejected';
        approvedAmount = 0;
      }

      if (approvedAmount > 0) {
        // Create new loan
        const newLoan = {
          id: generateLoanId(),
          type: selectedLoanType,
          typeName: loanDetails?.name,
          amount: approvedAmount,
          interestRate: loanDetails?.rate,
          tenure: parseInt(tenure),
          emi: calculateEMI(approvedAmount, loanDetails?.rate, parseInt(tenure)),
          remainingAmount: approvedAmount,
          status: 'Active',
          startDate: new Date().toISOString(),
          emiPaid: 0
        };

        // Add loan to user
        if (!users[userIndex].loans) {
          users[userIndex].loans = [];
        }
        users[userIndex].loans.push(newLoan);

        // Credit loan amount to user's balance
        const newBalance = balance + approvedAmount;
        users[userIndex].balance = newBalance;
        setBalance(newBalance);
        localStorage.setItem(`balance_${user.id}`, newBalance.toString());

        // Record transaction
        const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
        const loanTransaction = {
          id: Date.now().toString(),
          type: approvalStatus === 'Approved' ? 'loan_approved' : 'loan_conditionally_approved',
          description: `Loan ${approvalStatus.toLowerCase()} - ${loanDetails?.name}`,
          amount: approvedAmount,
          loanId: newLoan.id,
          date: new Date().toISOString(),
          status: 'completed'
        };
        transactions.unshift(loanTransaction);
        localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));

        // Update credit history
        updateCreditHistory(user.id, {
          type: 'loan_approved',
          description: `${loanDetails?.name} approved`,
          impact: 'positive',
          scoreChange: creditScore < 700 ? -5 : 0 // Small negative impact for conditional approval
        });

        showNotification(approvalMessage, approvalStatus === 'Approved' ? 'success' : 'warning');
      } else {
        // Record rejection
        const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
        const rejectionTransaction = {
          id: Date.now().toString(),
          type: 'loan_rejected',
          description: `Loan rejected - ${loanDetails?.name}`,
          amount: 0,
          date: new Date().toISOString(),
          status: 'failed'
        };
        transactions.unshift(rejectionTransaction);
        localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));

        // Update credit history
        updateCreditHistory(user.id, {
          type: 'loan_rejected',
          description: `${loanDetails?.name} application rejected`,
          impact: 'negative',
          scoreChange: -10
        });

        showNotification(approvalMessage, 'error');
      }

      // Save updated users
      localStorage.setItem('users', JSON.stringify(users));

      // Reset form
      setSelectedLoanType('');
      setLoanAmount('');
      setTenure('');
      setEmi(0);
      setErrors({});
      setLoanDetails(null);
      setEligibilityResult(null);

      // Navigate to loans page after a delay
      setTimeout(() => {
        navigate('/loans');
      }, 2000);

    } catch (error) {
      console.error('Loan application error:', error);
      showNotification('Error processing loan application', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render guard to prevent crashes
  if (!selectedLoanType || !loanAmount || !tenure) {
    return (
      <div className="dashboard-container">
        <Navigation />
        <div className="main-content">
          <Card title="Apply for Loan" className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Apply for Loan
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select a loan type and enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Loan Type Selection */}
              <div>
                <label className="form-label">Select Loan Type</label>
                <div className="grid grid grid-cols-2 md:grid-cols-3 gap-4">
                  {loanTypes.map((loanType) => (
                    <button
                      key={loanType.type}
                      type="button"
                      onClick={() => handleLoanTypeChange(loanType.type)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedLoanType === loanType.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{loanType.icon}</div>
                        <div className="font-medium">{loanType.name}</div>
                        <div className="text-sm text-gray-500">
                          {loanType.minAmount} - {loanType.maxAmount}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Amount */}
              <Input
                label="Loan Amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                error={errors.amount}
                placeholder="Enter loan amount"
              />

              {/* Loan Tenure */}
              <Input
                label="Tenure (Months)"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                error={errors.tenure}
                placeholder="Enter tenure in months"
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!selectedLoanType}
                className="w-full"
              >
                Apply for Loan
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navigation />
      <div className="main-content">
        <Card title="Apply for Loan" className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Apply for Loan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select a loan type and enter your details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loan Type Selection */}
            <div>
              <label className="form-label">Select Loan Type</label>
              <div className="grid grid grid-cols-2 md:grid-cols-3 gap-4">
                {loanTypes && loanTypes.map((loanType) => (
                  <button
                    key={loanType.type}
                    type="button"
                    onClick={() => handleLoanTypeChange(loanType.type)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedLoanType === loanType.type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{loanType.icon}</div>
                      <div className="font-medium">{loanType.name}</div>
                      <div className="text-sm text-gray-500">
                        {loanType.minAmount} - {loanType.maxAmount}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <Input
              label="Loan Amount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              error={errors && errors.amount}
              placeholder="Enter loan amount"
            />

            {/* Loan Tenure */}
            <Input
              label="Tenure (Months)"
              type="number"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              error={errors && errors.tenure}
              placeholder="Enter tenure in months"
            />

            {/* EMI Display */}
            {loanDetails && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {loanDetails.rate}% p.a.
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Monthly EMI:</span>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(emi)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {formatCurrency(emi * parseInt(tenure))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility Status */}
            {eligibilityResult && (
              <div className={`p-4 rounded-lg mb-4 ${
                eligibilityResult?.isEligible
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-lg font-semibold ${
                    eligibilityResult?.isEligible ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {eligibilityResult?.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </span>
                </div>
                
                {eligibilityResult?.reasons && eligibilityResult.reasons.length > 0 && (
                  <div className="text-sm text-red-600">
                    {eligibilityResult.reasons[0]}
                  </div>
                )}
                
                {eligibilityResult?.maxAmount && eligibilityResult.maxAmount !== parseFloat(loanAmount || 0) && (
                  <div className="text-sm text-blue-600 mt-2">
                    Maximum eligible amount: <strong>{formatCurrency(eligibilityResult.maxAmount)}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!eligibilityResult?.isEligible}
              className="w-full"
            >
              {eligibilityResult?.maxAmount !== parseFloat(loanAmount || 0) 
                ? `Apply for ${formatCurrency(eligibilityResult.maxAmount)}`
                : 'Apply for Loan'
              }
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ApplyLoan;
