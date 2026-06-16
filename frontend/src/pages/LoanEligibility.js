import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  getLoanTypes, 
  checkLoanEligibility, 
  calculateCreditScore,
  formatCurrency 
} from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const LoanEligibility = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [selectedLoanType, setSelectedLoanType] = useState('personal');
  const [loanAmount, setLoanAmount] = useState('');
  const [checking, setChecking] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [creditScore, setCreditScore] = useState(650);
  const [loanDetails, setLoanDetails] = useState(null);

  const loanTypes = getLoanTypes();

  useEffect(() => {
    if (user) {
      const score = calculateCreditScore(user);
      setCreditScore(score);
    }
  }, [user]);

  useEffect(() => {
    const loanType = loanTypes.find(lt => lt.type === selectedLoanType);
    setLoanDetails(loanType);
  }, [selectedLoanType]);

  const handleCheckEligibility = () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      showNotification('Please enter a valid loan amount', 'error');
      return;
    }

    setChecking(true);

    setTimeout(() => {
      const eligibility = checkLoanEligibility(user, parseFloat(loanAmount), selectedLoanType);
      setEligibilityResult(eligibility);
      setChecking(false);
    }, 1500); // Simulate API call
  };

  const handleApplyLoan = () => {
    if (!eligibilityResult?.isEligible) return;

    const amountToApply = eligibilityResult.maxAmount;
    navigate('/apply-loan', {
      state: {
        loanType: selectedLoanType,
        amount: amountToApply.toString(),
        tenure: '60' // Default tenure
      }
    });
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

  const getUserProfileSummary = () => {
    const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
    const loans = user.loans || [];
    const activeLoans = loans.filter(loan => loan.status === 'Active');
    const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);

    return {
      balance,
      activeLoans: activeLoans.length,
      totalMonthlyEMI,
      totalLoans: loans.length
    };
  };

  const profile = getUserProfileSummary();

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          {/* User Profile Summary */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Your Financial Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getCreditScoreColor(creditScore)}`}>
                  {creditScore}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Credit Score</p>
                <p className={`text-xs ${getCreditScoreColor(creditScore)}`}>
                  {getCreditScoreCategory(creditScore)}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(profile.balance)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account Balance</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.activeLoans}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Loans</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(profile.totalMonthlyEMI)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eligibility Checker */}
            <Card title="Check Loan Eligibility">
              <div className="space-y-6">
                {/* Loan Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Loan Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {loanTypes.map((loanType) => (
                      <button
                        key={loanType.type}
                        onClick={() => setSelectedLoanType(loanType.type)}
                        className={`p-3 border-2 rounded-lg text-sm transition-all ${
                          selectedLoanType === loanType.type
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {loanType.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {loanType.rate}% p.a.
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Desired Loan Amount"
                  type="number"
                  step="1000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Enter loan amount"
                  min={loanDetails?.minAmount}
                  max={loanDetails?.maxAmount}
                />

                {loanDetails && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Range: {formatCurrency(loanDetails.minAmount)} - {formatCurrency(loanDetails.maxAmount)}</p>
                  </div>
                )}

                <Button
                  onClick={handleCheckEligibility}
                  loading={checking}
                  disabled={!loanAmount}
                  className="w-full"
                >
                  Check Eligibility
                </Button>
              </div>
            </Card>

            {/* Eligibility Results */}
            <Card title="Eligibility Result">
              {!eligibilityResult ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter loan details and check eligibility
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Eligibility Status */}
                  <div className={`text-center p-6 rounded-lg ${
                    eligibilityResult.isEligible 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className={`text-2xl font-bold mb-2 ${
                      eligibilityResult.isEligible ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {eligibilityResult.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                    </div>
                    
                    {eligibilityResult.isEligible && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Maximum eligible amount:
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(eligibilityResult.maxAmount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reasons for Rejection */}
                  {!eligibilityResult.isEligible && eligibilityResult.reasons.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                        Reasons for Rejection:
                      </h4>
                      <ul className="space-y-2">
                        {eligibilityResult.reasons.map((reason, index) => (
                          <li key={index} className="text-sm text-red-600 flex items-start">
                            <span className="mr-2 text-red-500">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {eligibilityResult.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                        Suggestions:
                      </h4>
                      <ul className="space-y-2">
                        {eligibilityResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-blue-600 flex items-start">
                            <span className="mr-2">💡</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Apply Button */}
                  {eligibilityResult.isEligible && (
                    <Button
                      onClick={handleApplyLoan}
                      className="w-full"
                    >
                      Apply for {loanDetails?.name}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Eligibility Guidelines */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Eligibility Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Basic Requirements
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Credit score of 650 or higher</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Maximum 3 active loans</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>EMI burden less than 40% of income</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Regular transaction activity</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tips to Improve Eligibility
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Maintain a good credit score (700+)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Pay EMIs on time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Keep sufficient account balance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Limit number of active loans</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoanEligibility;
