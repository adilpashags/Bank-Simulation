import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const BillHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      // Load user's bills
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser && currentUser.bills) {
        setBills(currentUser.bills);
        setFilteredBills(currentUser.bills);
      }
    }
  }, [user]);

  useEffect(() => {
    let filtered = bills;

    // Filter by category
    if (filter !== 'all') {
      filtered = filtered.filter(bill => bill.category === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.consumerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  }, [filter, searchTerm, bills]);

  const getBillIcon = (category) => {
    switch (category) {
      case 'electricity': return '⚡';
      case 'water': return '💧';
      case 'gas': return '🔥';
      case 'mobile': return '📱';
      case 'internet': return '🌐';
      case 'creditcard': return '💳';
      case 'dth': return '📺';
      case 'insurance': return '🛡️';
      default: return '📄';
    }
  };

  const exportBills = () => {
    const csvContent = [
      ['Date', 'Category', 'Provider', 'Consumer Number', 'Amount', 'Status'].join(','),
      ...filteredBills.map(b => [
        formatDate(b.date),
        b.categoryName,
        b.provider,
        b.consumerNumber,
        b.amount,
        b.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_history_${user.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
  };

  const totalBillsPaid = filteredBills.length;
  const totalAmountPaid = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);

  const categories = [
    { type: 'all', name: 'All Bills' },
    { type: 'electricity', name: 'Electricity' },
    { type: 'water', name: 'Water' },
    { type: 'gas', name: 'Gas' },
    { type: 'mobile', name: 'Mobile Recharge' },
    { type: 'internet', name: 'Internet' },
    { type: 'creditcard', name: 'Credit Card' },
    { type: 'dth', name: 'DTH / TV' },
    { type: 'insurance', name: 'Insurance' }
  ];

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Bills Paid
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {totalBillsPaid}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Amount Paid
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalAmountPaid)}
                </p>
              </div>
            </Card>
          </div>

          {/* Bill History */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Bill History
              </h2>
              <Button
                onClick={() => navigate('/bill-payment')}
                variant="outline"
                size="sm"
              >
                Pay New Bill
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search bills by provider or consumer number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {categories.map(category => (
                    <option key={category.type} value={category.type}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={exportBills}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Bills List */}
            <div className="space-y-3">
              {filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    No Bills Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm || filter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Start paying bills to see them here'
                    }
                  </p>
                  <Button onClick={() => navigate('/bill-payment')}>
                    Pay Your First Bill
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Showing {filteredBills.length} of {bills.length} bills
                  </div>
                  {filteredBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">
                            {getBillIcon(bill.category)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {bill.categoryName} - {bill.provider}
                            </p>
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <p>Consumer: {bill.consumerNumber}</p>
                              <p>{formatDate(bill.date)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-red-600">
                            -{formatCurrency(bill.amount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            bill.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BillHistory;
