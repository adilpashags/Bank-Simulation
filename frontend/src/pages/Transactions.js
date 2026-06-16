import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatDate, detectFraud, addFraudAlert } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const Transactions = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [depositData, setDepositData] = useState({ amount: '', description: '' });
  const [withdrawData, setWithdrawData] = useState({ amount: '', description: '' });
  const [transferData, setTransferData] = useState({ 
    toAccount: '', 
    amount: '', 
    description: '' 
  });
  
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (user) {
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      setBalance(parseFloat(userBalance) || 0);
    }
  }, [user]);

  const saveTransaction = (type, data) => {
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(data.amount),
      description: data.description || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      date: new Date().toISOString(),
      status: 'completed'
    };

    if (type === 'transfer') {
      newTransaction.toAccount = data.toAccount;
    }

    transactions.unshift(newTransaction);
    localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!depositData.amount || parseFloat(depositData.amount) <= 0) {
      newErrors.depositAmount = 'Please enter a valid amount';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const amount = parseFloat(depositData.amount);
    const newBalance = balance + amount;
    
    // Create transaction object for fraud detection
    const newTransaction = {
      id: Date.now().toString(),
      type: 'deposit',
      description: depositData.description || 'Deposit',
      amount: amount,
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Check for fraud
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const fraudResult = detectFraud(newTransaction, transactions, balance);
    
    if (fraudResult.isFraud) {
      // Mark transaction as flagged
      newTransaction.status = 'flagged';
      newTransaction.fraud = true;
      
      // Add fraud alert
      addFraudAlert(user.id, newTransaction, fraudResult);
      
      showNotification('Suspicious transaction detected! Transaction flagged for review.', 'error');
    } else {
      // Update balance
      setBalance(newBalance);
      localStorage.setItem(`balance_${user.id}`, newBalance.toString());
      
      showNotification(`Successfully deposited ${formatCurrency(amount)}`, 'success');
      setDepositData({ amount: '', description: '' });
      setErrors({});
    }

    // Save transaction
    const updatedTransactions = [newTransaction, ...transactions];
    localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTransactions));
    
    setLoading(false);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) {
      newErrors.withdrawAmount = 'Please enter a valid amount';
    }
    
    if (parseFloat(withdrawData.amount) > balance) {
      newErrors.withdrawAmount = 'Insufficient balance';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const amount = parseFloat(withdrawData.amount);
    const newBalance = balance - amount;
    
    // Create transaction object for fraud detection
    const newTransaction = {
      id: Date.now().toString(),
      type: 'withdraw',
      description: withdrawData.description || 'Withdraw',
      amount: amount,
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Check for fraud
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const fraudResult = detectFraud(newTransaction, transactions, balance);
    
    if (fraudResult.isFraud) {
      // Mark transaction as flagged
      newTransaction.status = 'flagged';
      newTransaction.fraud = true;
      
      // Add fraud alert
      addFraudAlert(user.id, newTransaction, fraudResult);
      
      showNotification('Suspicious transaction detected! Transaction flagged for review.', 'error');
    } else {
      // Update balance
      setBalance(newBalance);
      localStorage.setItem(`balance_${user.id}`, newBalance.toString());
      
      showNotification(`Successfully withdrew ${formatCurrency(amount)}`, 'success');
      setWithdrawData({ amount: '', description: '' });
      setErrors({});
    }

    // Save transaction
    const updatedTransactions = [newTransaction, ...transactions];
    localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTransactions));
    
    setLoading(false);
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!transferData.toAccount.trim()) {
      newErrors.toAccount = 'Recipient account number is required';
    }
    
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      newErrors.transferAmount = 'Please enter a valid amount';
    }
    
    if (parseFloat(transferData.amount) > balance) {
      newErrors.transferAmount = 'Insufficient balance';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const amount = parseFloat(transferData.amount);
    
    // Check if recipient account exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const recipient = users.find(u => u.accountNumber === transferData.toAccount);
    
    if (!recipient) {
      setErrors({ toAccount: 'Account number not found' });
      setLoading(false);
      return;
    }

    if (recipient.id === user.id) {
      setErrors({ toAccount: 'Cannot transfer to your own account' });
      setLoading(false);
      return;
    }

    // Process transfer
    const senderNewBalance = balance - amount;
    const recipientBalance = parseFloat(localStorage.getItem(`balance_${recipient.id}`) || '0');
    const recipientNewBalance = recipientBalance + amount;

    // Create transaction object for fraud detection
    const newTransaction = {
      id: Date.now().toString(),
      type: 'transfer',
      description: transferData.description || 'Transfer',
      amount: amount,
      toAccount: transferData.toAccount,
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Check for fraud
    const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
    const fraudResult = detectFraud(newTransaction, transactions, balance);
    
    if (fraudResult.isFraud) {
      // Mark transaction as flagged
      newTransaction.status = 'flagged';
      newTransaction.fraud = true;
      
      // Add fraud alert
      addFraudAlert(user.id, newTransaction, fraudResult);
      
      showNotification('Suspicious transaction detected! Transfer flagged for review.', 'error');
    } else {
      // Update balances
      setBalance(senderNewBalance);
      localStorage.setItem(`balance_${user.id}`, senderNewBalance.toString());
      localStorage.setItem(`balance_${recipient.id}`, recipientNewBalance.toString());

      // Save sender's transaction
      const updatedTransactions = [newTransaction, ...transactions];
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTransactions));

      // Save recipient's transaction
      const recipientTransactions = JSON.parse(localStorage.getItem(`transactions_${recipient.id}`) || '[]');
      const recipientTransaction = {
        id: Date.now().toString() + '_recipient',
        type: 'received',
        description: `Transfer received from ${user.accountNumber}`,
        amount: amount,
        fromAccount: user.accountNumber,
        date: new Date().toISOString(),
        status: 'completed'
      };
      recipientTransactions.unshift(recipientTransaction);
      localStorage.setItem(`transactions_${recipient.id}`, JSON.stringify(recipientTransactions));

      showNotification(`Successfully transferred ${formatCurrency(amount)} to account ${transferData.toAccount}`, 'success');
    }

    setTransferData({ toAccount: '', amount: '', description: '' });
    setErrors({});
    setLoading(false);
  };

  const tabs = [
    { id: 'deposit', label: 'Deposit', icon: '💰' },
    { id: 'withdraw', label: 'Withdraw', icon: '💸' },
    { id: 'transfer', label: 'Transfer', icon: '🏦' }
  ];

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-4xl mx-auto">
        {/* Balance Card */}
        <Card className="mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Current Balance</h2>
            <p className="text-4xl font-bold text-green-600">{formatCurrency(balance)}</p>
          </div>
        </Card>

        {/* Transaction Tabs */}
        <Card>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrors({});
                }}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-purple-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-md mx-auto">
            {/* Deposit Form */}
            {activeTab === 'deposit' && (
              <form onSubmit={handleDeposit} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Deposit Money</h3>
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={depositData.amount}
                  onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                  placeholder="Enter amount to deposit"
                  error={errors.depositAmount}
                  required
                />
                <Input
                  label="Description (Optional)"
                  type="text"
                  value={depositData.description}
                  onChange={(e) => setDepositData({...depositData, description: e.target.value})}
                  placeholder="Enter description"
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Deposit
                </Button>
              </form>
            )}

            {/* Withdraw Form */}
            {activeTab === 'withdraw' && (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Withdraw Money</h3>
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                  placeholder="Enter amount to withdraw"
                  error={errors.withdrawAmount}
                  required
                />
                <Input
                  label="Description (Optional)"
                  type="text"
                  value={withdrawData.description}
                  onChange={(e) => setWithdrawData({...withdrawData, description: e.target.value})}
                  placeholder="Enter description"
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Withdraw
                </Button>
              </form>
            )}

            {/* Transfer Form */}
            {activeTab === 'transfer' && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Transfer Money</h3>
                <Input
                  label="Recipient Account Number"
                  type="text"
                  value={transferData.toAccount}
                  onChange={(e) => setTransferData({...transferData, toAccount: e.target.value})}
                  placeholder="Enter account number"
                  error={errors.toAccount}
                  required
                />
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  placeholder="Enter amount to transfer"
                  error={errors.transferAmount}
                  required
                />
                <Input
                  label="Description (Optional)"
                  type="text"
                  value={transferData.description}
                  onChange={(e) => setTransferData({...transferData, description: e.target.value})}
                  placeholder="Enter description"
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Transfer
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Transactions;
