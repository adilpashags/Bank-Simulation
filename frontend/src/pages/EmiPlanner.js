import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  calculateEMI, 
  getLoanTypes, 
  checkLoanEligibility,
  formatCurrency 
} from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const EmiPlanner = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [selectedLoanType, setSelectedLoanType] = useState('personal');
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState('60');
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [eligibility, setEligibility] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);

  const loanTypes = getLoanTypes();

  useEffect(() => {
    const loanType = loanTypes.find(lt => lt.type === selectedLoanType);
    setLoanDetails(loanType);
    
    if (loanAmount && tenure) {
      const calculatedEmi = calculateEMI(
        parseFloat(loanAmount || 0), 
        loanType.rate, 
        parseInt(tenure)
      );
      const total = calculatedEmi * parseInt(tenure);
      const interest = total - parseFloat(loanAmount || 0);
      
      setEmi(calculatedEmi);
      setTotalPayment(total);
      setTotalInterest(interest);
      
      // Check eligibility
      if (user && loanAmount) {
        const eligibilityResult = checkLoanEligibility(user, parseFloat(loanAmount), selectedLoanType);
        setEligibility(eligibilityResult);
      }
    }
  }, [selectedLoanType, loanAmount, tenure, user]);

  const handleLoanTypeChange = (type) => {
    setSelectedLoanType(type);
    const loanType = loanTypes.find(lt => lt.type === type);
    setLoanDetails(loanType);
  };

  const handleApplyLoan = () => {
    if (!eligibility || !eligibility.isEligible) {
      showNotification('You are not eligible for this loan', 'error');
      return;
    }

    // Navigate to apply loan page with pre-filled values
    navigate('/apply-loan', {
      state: {
        loanType: selectedLoanType,
        amount: loanAmount,
        tenure: tenure
      }
    });
  };

  const generateMonthlyBreakdown = () => {
    if (!emi || !tenure) return [];
    
    const breakdown = [];
    let remainingPrincipal = parseFloat(loanAmount || 0);
    const monthlyRate = (loanDetails?.rate || 12) / 12 / 100;
    
    for (let month = 1; month <= Math.min(parseInt(tenure), 12); month++) {
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = emi - interestPayment;
      remainingPrincipal -= principalPayment;
      
      breakdown.push({
        month,
        emi,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingPrincipal)
      });
    }
    
    return breakdown;
  };

  const monthlyBreakdown = generateMonthlyBreakdown();

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* EMI Calculator */}
            <div className="lg:col-span-2">
              <Card title="EMI Calculator" className="mb-6">
                <div className="space-y-6">
                  {/* Loan Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Loan Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {loanTypes.map((loanType) => (
                        <button
                          key={loanType.type}
                          onClick={() => handleLoanTypeChange(loanType.type)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Loan Amount"
                      type="number"
                      step="1000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="Enter loan amount"
                      min={loanDetails?.minAmount}
                      max={loanDetails?.maxAmount}
                    />

                    <Input
                      label="Tenure (Months)"
                      type="number"
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                      placeholder="Enter tenure in months"
                      min="12"
                      max="360"
                    />
                  </div>

                  {loanDetails && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Min: {formatCurrency(loanDetails.minAmount)} | Max: {formatCurrency(loanDetails.maxAmount)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Monthly Breakdown */}
              {monthlyBreakdown.length > 0 && (
                <Card title="Monthly Breakdown (First 12 Months)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-2 px-3">Month</th>
                          <th className="text-right py-2 px-3">EMI</th>
                          <th className="text-right py-2 px-3">Principal</th>
                          <th className="text-right py-2 px-3">Interest</th>
                          <th className="text-right py-2 px-3">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBreakdown.map((row) => (
                          <tr key={row.month} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 px-3">{row.month}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(row.emi)}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(row.principal)}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(row.interest)}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            {/* Results & Eligibility */}
            <div className="space-y-6">
              {/* EMI Results */}
              <Card title="EMI Details">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {formatCurrency(emi)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Principal:</span>
                      <span className="font-semibold">{formatCurrency(loanAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Interest:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Payment:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(totalPayment)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Eligibility Check */}
              {eligibility && (
                <Card title="Loan Eligibility">
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-lg ${
                      eligibility.isEligible 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className={`text-lg font-semibold ${
                        eligibility.isEligible ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {eligibility.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                      </div>
                    </div>

                    {!eligibility.isEligible && eligibility.reasons.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Reasons:</h4>
                        <ul className="space-y-1">
                          {eligibility.reasons.map((reason, index) => (
                            <li key={index} className="text-sm text-red-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {eligibility.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Suggestions:</h4>
                        <ul className="space-y-1">
                          {eligibility.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-blue-600 flex items-start">
                              <span className="mr-2">💡</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {eligibility.maxAmount !== parseFloat(loanAmount || 0) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Maximum eligible amount: <strong>{formatCurrency(eligibility.maxAmount)}</strong></p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Apply Button */}
              <Button
                onClick={handleApplyLoan}
                disabled={!eligibility?.isEligible || !loanAmount}
                className="w-full"
              >
                Apply This Loan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmiPlanner;
