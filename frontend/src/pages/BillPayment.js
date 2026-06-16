import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getBillCategories, generateBillId, formatCurrency } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const BillPayment = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [errors, setErrors] = useState({});
  const [favoriteBillers, setFavoriteBillers] = useState([]);

  const billCategories = getBillCategories();

  useEffect(() => {
    if (user) {
      // Load user's balance
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      setBalance(parseFloat(userBalance) || 0);

      // Load favorite billers
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser && currentUser.favoriteBillers) {
        setFavoriteBillers(currentUser.favoriteBillers);
      }
    }
  }, [user]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setProvider('');
    setConsumerNumber('');
    setAmount('');
    setErrors({});
  };

  const handleFavoriteSelect = (biller) => {
    setSelectedCategory(biller.category);
    setProvider(biller.provider);
    setConsumerNumber(biller.consumerNumber);
    setAmount('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCategory) {
      newErrors.category = 'Please select a bill category';
    }
    
    if (!provider.trim()) {
      newErrors.provider = 'Please enter provider name';
    }
    
    if (!consumerNumber.trim()) {
      newErrors.consumerNumber = 'Please enter consumer/account number';
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (parseFloat(amount) > balance) {
      newErrors.amount = 'Insufficient balance';
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

      // Create new bill payment record
      const newBill = {
        id: generateBillId(),
        category: selectedCategory,
        categoryName: billCategories.find(c => c.type === selectedCategory)?.name,
        provider: provider.trim(),
        consumerNumber: consumerNumber.trim(),
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        status: 'completed'
      };

      // Add bill to user's bills history
      if (!users[userIndex].bills) {
        users[userIndex].bills = [];
      }
      users[userIndex].bills.unshift(newBill);

      // Save as favorite if checked
      if (saveAsFavorite) {
        if (!users[userIndex].favoriteBillers) {
          users[userIndex].favoriteBillers = [];
        }
        
        // Check if already exists
        const exists = users[userIndex].favoriteBillers.some(
          b => b.category === selectedCategory && 
               b.provider === provider.trim() && 
               b.consumerNumber === consumerNumber.trim()
        );
        
        if (!exists) {
          users[userIndex].favoriteBillers.push({
            category: selectedCategory,
            categoryName: billCategories.find(c => c.type === selectedCategory)?.name,
            provider: provider.trim(),
            consumerNumber: consumerNumber.trim()
          });
        }
      }

      // Update user balance
      const newBalance = balance - parseFloat(amount);
      users[userIndex].balance = newBalance;
      setBalance(newBalance);
      localStorage.setItem(`balance_${user.id}`, newBalance.toString());

      // Save updated users
      localStorage.setItem('users', JSON.stringify(users));

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      const billTransaction = {
        id: Date.now().toString(),
        type: 'bill_payment',
        description: `Bill payment - ${newBill.categoryName} (${provider})`,
        amount: parseFloat(amount),
        billId: newBill.id,
        date: new Date().toISOString(),
        status: 'completed'
      };
      transactions.unshift(billTransaction);
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));

      // Update local state
      if (saveAsFavorite) {
        setFavoriteBillers(users[userIndex].favoriteBillers);
      }

      showNotification(`Bill payment of ${formatCurrency(amount)} successful!`, 'success');
      
      // Reset form
      setSelectedCategory('');
      setProvider('');
      setConsumerNumber('');
      setAmount('');
      setSaveAsFavorite(false);
      setErrors({});

      // Navigate to bill history after a delay
      setTimeout(() => {
        navigate('/bill-history');
      }, 2000);

    } catch (error) {
      console.error('Bill payment error:', error);
      showNotification('Error processing bill payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-4xl mx-auto">
          {/* Current Balance */}
          <Card className="mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Available Balance
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(balance)}
              </p>
            </div>
          </Card>

          {/* Favorite Billers */}
          {favoriteBillers.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Favorite Billers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favoriteBillers.map((biller, index) => (
                  <div
                    key={index}
                    onClick={() => handleFavoriteSelect(biller)}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {biller.categoryName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {biller.provider}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {biller.consumerNumber}
                        </p>
                      </div>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bill Payment Form */}
          <Card title="Pay Bills">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bill Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Bill Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {billCategories.map((category) => (
                    <button
                      key={category.type}
                      type="button"
                      onClick={() => handleCategoryChange(category.type)}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedCategory === category.type
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {category.type === 'electricity' && '⚡'}
                          {category.type === 'water' && '💧'}
                          {category.type === 'gas' && '🔥'}
                          {category.type === 'mobile' && '📱'}
                          {category.type === 'internet' && '🌐'}
                          {category.type === 'creditcard' && '💳'}
                          {category.type === 'dth' && '📺'}
                          {category.type === 'insurance' && '🛡️'}
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {category.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-2">{errors.category}</p>
                )}
              </div>

              {selectedCategory && (
                <>
                  {/* Provider */}
                  <Input
                    label="Provider Name"
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Enter provider name (e.g., BESCOM, Airtel, etc.)"
                    error={errors.provider}
                    required
                  />

                  {/* Consumer Number */}
                  <Input
                    label="Consumer / Account Number"
                    type="text"
                    value={consumerNumber}
                    onChange={(e) => setConsumerNumber(e.target.value)}
                    placeholder="Enter consumer or account number"
                    error={errors.consumerNumber}
                    required
                  />

                  {/* Amount */}
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter bill amount"
                    error={errors.amount}
                    required
                  />

                  {/* Save as Favorite */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="saveAsFavorite"
                      checked={saveAsFavorite}
                      onChange={(e) => setSaveAsFavorite(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="saveAsFavorite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Save as favorite biller
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full"
                  >
                    Pay Bill
                  </Button>
                </>
              )}
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BillPayment;
