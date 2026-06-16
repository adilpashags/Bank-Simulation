// Simple password hashing utility for simulation
export const hashPassword = (password) => {
  // Simple hash for simulation (NOT secure for production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return btoa(hash.toString()).replace(/=/g, '');
};

export const generateAccountNumber = () => {
  // Generate realistic bank account number
  const prefix = 'ACC';
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefix}${randomDigits}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Loan calculation utilities
export const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
               (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100; // Round to 2 decimal places
};

export const getLoanTypes = () => [
  { type: 'personal', name: 'Personal Loan', minAmount: 10000, maxAmount: 500000, rate: 12 },
  { type: 'home', name: 'Home Loan', minAmount: 100000, maxAmount: 2000000, rate: 8 },
  { type: 'car', name: 'Car Loan', minAmount: 50000, maxAmount: 1000000, rate: 9 },
  { type: 'education', name: 'Education Loan', minAmount: 20000, maxAmount: 800000, rate: 7 },
  { type: 'gold', name: 'Gold Loan', minAmount: 5000, maxAmount: 200000, rate: 10 },
  { type: 'business', name: 'Business Loan', minAmount: 50000, maxAmount: 1500000, rate: 13 }
];

export const getBillCategories = () => [
  { type: 'electricity', name: 'Electricity' },
  { type: 'water', name: 'Water' },
  { type: 'gas', name: 'Gas' },
  { type: 'mobile', name: 'Mobile Recharge' },
  { type: 'internet', name: 'Internet / Broadband' },
  { type: 'creditcard', name: 'Credit Card Bill' },
  { type: 'dth', name: 'DTH / TV' },
  { type: 'insurance', name: 'Insurance Premium' }
];

export const generateLoanId = () => {
  return 'LOAN' + Date.now().toString().slice(-8);
};

export const generateBillId = () => {
  return 'BILL' + Date.now().toString().slice(-8);
};

// Credit Score System
export const calculateCreditScore = (user) => {
  let score = 650; // Base score
  
  // Factor 1: Account balance level
  const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
  if (balance > 100000) score += 30;
  else if (balance > 50000) score += 20;
  else if (balance > 20000) score += 10;
  else if (balance < 5000) score -= 20;
  
  // Factor 2: Transaction activity
  const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );
  if (recentTransactions.length > 20) score += 20;
  else if (recentTransactions.length > 10) score += 10;
  else if (recentTransactions.length < 3) score -= 15;
  
  // Factor 3: Loan repayment history
  const loans = user.loans || [];
  const successfulEMIs = loans.reduce((sum, loan) => sum + (loan.emiPaid || 0), 0);
  if (successfulEMIs > 12) score += 30;
  else if (successfulEMIs > 6) score += 20;
  else if (successfulEMIs > 0) score += 10;
  
  // Factor 4: Missed EMI (check transaction history for failed attempts)
  const missedEMIs = transactions.filter(t => 
    t.type === 'emi_failed' || 
    (t.type === 'emi_payment' && t.status === 'failed')
  ).length;
  score -= missedEMIs * 40;
  
  // Factor 5: Loan utilization
  const activeLoans = loans.filter(loan => loan.status === 'Active').length;
  if (activeLoans > 3) score -= 20;
  else if (activeLoans > 2) score -= 10;
  
  // Factor 6: Account age (registration date)
  const accountAge = Math.floor((Date.now() - new Date(user.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
  if (accountAge > 365) score += 20;
  else if (accountAge > 180) score += 10;
  else if (accountAge < 30) score -= 10;
  
  // Ensure score stays within bounds
  return Math.max(300, Math.min(900, score));
};

export const getCreditScoreCategory = (score) => {
  if (score >= 750) return { category: 'Excellent', color: 'green', description: 'Excellent creditworthiness' };
  if (score >= 700) return { category: 'Good', color: 'blue', description: 'Good credit standing' };
  if (score >= 650) return { category: 'Fair', color: 'yellow', description: 'Fair credit history' };
  return { category: 'Poor', color: 'red', description: 'Needs improvement' };
};

export const checkLoanEligibility = (user, loanAmount, loanType) => {
  const creditScore = user.creditScore || calculateCreditScore(user);
  const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
  const loans = user.loans || [];
  const activeLoans = loans.filter(loan => loan.status === 'Active');
  
  const eligibility = {
    isEligible: true,
    maxAmount: loanAmount,
    reasons: [],
    suggestions: []
  };
  
  // Check credit score threshold
  if (creditScore < 650) {
    eligibility.isEligible = false;
    eligibility.reasons.push(`Credit score too low (${creditScore}). Minimum required: 650`);
    eligibility.suggestions.push('Improve credit score by making regular transactions and timely EMI payments');
  }
  
  // Check active loans limit
  if (activeLoans.length >= 3) {
    eligibility.isEligible = false;
    eligibility.reasons.push(`Too many active loans (${activeLoans.length}). Maximum allowed: 3`);
    eligibility.suggestions.push('Pay off existing loans before applying for new ones');
  }
  
  // Check EMI-to-income ratio (using balance as income proxy)
  const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);
  const monthlyIncome = balance / 2; // Rough estimate
  const newEMI = calculateEMI(loanAmount, getLoanTypes().find(l => l.type === loanType)?.rate || 12, 60);
  const totalEMIWithNew = totalMonthlyEMI + newEMI;
  
  if (totalEMIWithNew > monthlyIncome * 0.4) {
    eligibility.isEligible = false;
    eligibility.reasons.push(`EMI burden too high (${Math.round((totalEMIWithNew/monthlyIncome)*100)}%). Maximum allowed: 40%`);
    eligibility.suggestions.push('Consider lower loan amount or longer tenure');
  }
  
  // Adjust maximum amount based on profile
  if (creditScore < 700) {
    eligibility.maxAmount = Math.min(eligibility.maxAmount, loanAmount * 0.7);
  }
  if (activeLoans.length >= 2) {
    eligibility.maxAmount = Math.min(eligibility.maxAmount, loanAmount * 0.8);
  }
  
  return eligibility;
};

export const updateCreditHistory = (userId, event) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    if (!users[userIndex].creditHistory) {
      users[userIndex].creditHistory = [];
    }
    
    users[userIndex].creditHistory.push({
      id: Date.now().toString(),
      event: event.type,
      description: event.description,
      impact: event.impact, // positive, negative, neutral
      scoreChange: event.scoreChange,
      date: new Date().toISOString()
    });
    
    // Keep only last 50 entries
    if (users[userIndex].creditHistory.length > 50) {
      users[userIndex].creditHistory = users[userIndex].creditHistory.slice(-50);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Fraud Detection System
export const detectFraud = (transaction, userTransactions, userBalance) => {
  const fraudFlags = [];
  const amount = parseFloat(transaction.amount);
  
  // Rule 1: Transaction amount > 50,000
  if (amount > 50000) {
    fraudFlags.push({
      type: 'high_amount',
      description: `Transaction amount ${formatCurrency(amount)} exceeds threshold`,
      severity: 'high'
    });
  }
  
  // Rule 2: More than 3 transactions within 1 minute
  const recentTransactions = userTransactions.filter(t => 
    Math.abs(new Date(t.date) - new Date(transaction.date)) < 60000 // 1 minute
  );
  if (recentTransactions.length >= 3) {
    fraudFlags.push({
      type: 'rapid_transactions',
      description: `${recentTransactions.length} transactions detected within 1 minute`,
      severity: 'high'
    });
  }
  
  // Rule 3: Multiple transfers to different accounts rapidly
  const recentTransfers = userTransactions.filter(t => 
    (t.type === 'transfer' || t.type === 'withdraw') &&
    Math.abs(new Date(t.date) - new Date(transaction.date)) < 300000 // 5 minutes
  );
  const uniqueAccounts = new Set(recentTransfers.map(t => t.toAccount)).size;
  if (uniqueAccounts >= 3) {
    fraudFlags.push({
      type: 'multiple_transfers',
      description: `Transfers to ${uniqueAccounts} different accounts within 5 minutes`,
      severity: 'medium'
    });
  }
  
  // Rule 4: Withdrawal when balance is very low
  if (userBalance < 5000 && (transaction.type === 'withdraw' || transaction.type === 'transfer')) {
    fraudFlags.push({
      type: 'low_balance_withdrawal',
      description: `Withdrawal of ${formatCurrency(amount)} when balance is low (${formatCurrency(userBalance)})`,
      severity: 'medium'
    });
  }
  
  // Rule 5: Unusual spike compared to user's average
  const userAverageAmount = calculateAverageTransactionAmount(userTransactions);
  if (userAverageAmount > 0 && amount > userAverageAmount * 5) {
    fraudFlags.push({
      type: 'unusual_spike',
      description: `Transaction amount ${formatCurrency(amount)} is 5x higher than average ${formatCurrency(userAverageAmount)}`,
      severity: 'medium'
    });
  }
  
  return {
    isFraud: fraudFlags.length > 0,
    flags: fraudFlags,
    severity: fraudFlags.some(f => f.severity === 'high') ? 'high' : 'medium'
  };
};

export const calculateAverageTransactionAmount = (transactions) => {
  if (transactions.length === 0) return 0;
  
  const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  return total / transactions.length;
};

export const addFraudAlert = (userId, transaction, fraudResult) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    if (!users[userIndex].fraudAlerts) {
      users[userIndex].fraudAlerts = [];
    }
    
    const fraudAlert = {
      id: Date.now().toString(),
      transactionId: transaction.id,
      transaction: transaction,
      flags: fraudResult.flags,
      severity: fraudResult.severity,
      status: 'flagged', // flagged, reviewed, resolved
      date: new Date().toISOString()
    };
    
    users[userIndex].fraudAlerts.unshift(fraudAlert);
    
    // Keep only last 100 alerts
    if (users[userIndex].fraudAlerts.length > 100) {
      users[userIndex].fraudAlerts = users[userIndex].fraudAlerts.slice(0, 100);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Spending Analytics
export const calculateSpendingAnalytics = (transactions, userId) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  const analytics = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    totalBillPayments: 0,
    totalEMIPayments: 0,
    categoryBreakdown: {},
    monthlyTrend: [],
    incomeVsExpense: { income: 0, expense: 0 }
  };
  
  monthlyTransactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount);
    
    switch (transaction.type) {
      case 'deposit':
      case 'loan_credit':
        analytics.totalDeposits += amount;
        analytics.incomeVsExpense.income += amount;
        analytics.categoryBreakdown.deposits = (analytics.categoryBreakdown.deposits || 0) + amount;
        break;
      case 'withdraw':
        analytics.totalWithdrawals += amount;
        analytics.incomeVsExpense.expense += amount;
        analytics.categoryBreakdown.withdrawals = (analytics.categoryBreakdown.withdrawals || 0) + amount;
        break;
      case 'transfer':
        analytics.totalTransfers += amount;
        analytics.incomeVsExpense.expense += amount;
        analytics.categoryBreakdown.transfers = (analytics.categoryBreakdown.transfers || 0) + amount;
        break;
      case 'bill_payment':
        analytics.totalBillPayments += amount;
        analytics.incomeVsExpense.expense += amount;
        analytics.categoryBreakdown.bills = (analytics.categoryBreakdown.bills || 0) + amount;
        break;
      case 'emi_payment':
        analytics.totalEMIPayments += amount;
        analytics.incomeVsExpense.expense += amount;
        analytics.categoryBreakdown.emi = (analytics.categoryBreakdown.emi || 0) + amount;
        break;
    }
  });
  
  return analytics;
};

// Financial Health Score
export const calculateFinancialHealthScore = (user) => {
  const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
  const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
  const loans = user.loans || [];
  const creditScore = user.creditScore || 650;
  
  let healthScore = 50; // Base score
  
  // Factor 1: Balance level (30%)
  if (balance > 100000) healthScore += 15;
  else if (balance > 50000) healthScore += 10;
  else if (balance > 20000) healthScore += 5;
  else if (balance < 5000) healthScore -= 10;
  
  // Factor 2: Savings ratio (25%)
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' || t.type === 'loan_credit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => ['withdraw', 'transfer', 'bill_payment', 'emi_payment'].includes(t.type))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  if (totalDeposits > 0) {
    const savingsRatio = (balance / totalDeposits) * 100;
    if (savingsRatio > 50) healthScore += 12;
    else if (savingsRatio > 25) healthScore += 8;
    else if (savingsRatio > 10) healthScore += 4;
    else healthScore -= 5;
  }
  
  // Factor 3: Credit score (25%)
  if (creditScore >= 750) healthScore += 12;
  else if (creditScore >= 700) healthScore += 8;
  else if (creditScore >= 650) healthScore += 4;
  else healthScore -= 8;
  
  // Factor 4: Loan burden (20%)
  const totalMonthlyEMI = loans
    .filter(loan => loan.status === 'Active')
    .reduce((sum, loan) => sum + loan.emi, 0);
  const monthlyIncome = balance / 2; // Rough estimate
  const emiBurden = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 0;
  
  if (emiBurden < 20) healthScore += 10;
  else if (emiBurden < 40) healthScore += 5;
  else healthScore -= 10;
  
  return Math.max(0, Math.min(100, healthScore));
};

// Financial Advisor Rules
export const generateFinancialAdvice = (user, analytics, healthScore) => {
  const advice = [];
  const balance = parseFloat(localStorage.getItem(`balance_${user.id}`) || 0);
  const creditScore = user.creditScore || 650;
  const loans = user.loans || [];
  const activeLoans = loans.filter(loan => loan.status === 'Active');
  
  // Savings Advice
  if (analytics.incomeVsExpense.expense > analytics.incomeVsExpense.income) {
    advice.push({
      type: 'savings',
      priority: 'high',
      title: 'High Spending Alert',
      description: 'Your expenses exceed your income. Consider reducing discretionary expenses.',
      icon: '⚠️'
    });
  }
  
  if (balance < 5000) {
    advice.push({
      type: 'savings',
      priority: 'medium',
      title: 'Low Balance Warning',
      description: 'Maintain minimum balance to avoid financial risk.',
      icon: '💰'
    });
  }
  
  // Loan Advice
  const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + loan.emi, 0);
  const monthlyIncome = balance / 2;
  const emiBurden = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 0;
  
  if (emiBurden > 40) {
    advice.push({
      type: 'loan',
      priority: 'high',
      title: 'High EMI Burden',
      description: 'Your EMI burden is very high. Avoid new loans and consider debt consolidation.',
      icon: '🏦'
    });
  }
  
  if (creditScore > 750 && activeLoans.length === 0) {
    advice.push({
      type: 'loan',
      priority: 'low',
      title: 'Excellent Credit Opportunity',
      description: 'You are eligible for better loan interest rates with your excellent credit score.',
      icon: '🎯'
    });
  }
  
  // Spending Advice
  if (analytics.totalBillPayments > 50000) {
    advice.push({
      type: 'spending',
      priority: 'medium',
      title: 'High Bill Payments',
      description: 'Consider optimizing your bill payment plans to reduce monthly expenses.',
      icon: '📄'
    });
  }
  
  const frequentWithdrawals = analytics.categoryBreakdown.withdrawals > 20000;
  if (frequentWithdrawals) {
    advice.push({
      type: 'spending',
      priority: 'low',
      title: 'Frequent Withdrawals',
      description: 'Consider using digital payments to reduce withdrawal frequency.',
      icon: '💳'
    });
  }
  
  return advice;
};
