import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, calculateSpendingAnalytics } from '../utils/helpers';
import Card from '../components/Card';
import Navigation from '../components/Navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const Analytics = () => {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) {
      const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      const analyticsData = calculateSpendingAnalytics(transactions, user.id);
      setAnalytics(analyticsData);
    }
  }, [user]);

  const monthlyTrendData = [
    { name: 'Jan', income: 45000, expense: 32000 },
    { name: 'Feb', income: 52000, expense: 38000 },
    { name: 'Mar', income: 48000, expense: 42000 },
    { name: 'Apr', income: 61000, expense: 45000 },
    { name: 'May', income: 55000, expense: 48000 },
    { name: 'Jun', income: 58000, expense: 51000 },
  ];

  const categoryData = analytics ? [
    { name: 'Deposits', value: analytics.totalDeposits, color: '#10b981' },
    { name: 'Withdrawals', value: analytics.totalWithdrawals, color: '#ef4444' },
    { name: 'Transfers', value: analytics.totalTransfers, color: '#f59e0b' },
    { name: 'Bill Payments', value: analytics.totalBillPayments, color: '#8b5cf6' },
    { name: 'EMI Payments', value: analytics.totalEMIPayments, color: '#ec4899' },
  ].filter(item => item.value > 0) : [];

  const incomeVsExpenseData = analytics ? [
    { name: 'Income', value: analytics.incomeVsExpense.income, color: '#10b981' },
    { name: 'Expense', value: analytics.incomeVsExpense.expense, color: '#ef4444' },
  ] : [];

  const spendingBreakdown = analytics ? Object.entries(analytics.categoryBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
    percentage: analytics.incomeVsExpense.expense > 0 ? (value / analytics.incomeVsExpense.expense * 100).toFixed(1) : 0
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
          <p className="text-sm font-medium">{`${label}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
          <p className="text-sm font-medium">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-xs text-gray-500">{`${payload[0].percentage}% of total expenses`}</p>
        </div>
      );
    }
    return null;
  };

  if (!analytics) {
    return (
      <>
        <Navigation />
        <div className="dashboard-container">
          <div className="max-w-6xl mx-auto">
            <Card>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-7xl mx-auto">
          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Deposits
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalDeposits)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Withdrawals
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analytics.totalWithdrawals)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Transfers
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(analytics.totalTransfers)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Bill Payments
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.totalBillPayments)}
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Trend */}
            <Card title="Monthly Spending Trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Expense"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Income vs Expense */}
            <Card title="Income vs Expense">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeVsExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8">
                    {incomeVsExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Category-wise Spending">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Spending Breakdown */}
            <Card title="Spending Breakdown">
              <div className="space-y-3">
                {spendingBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryData.find(c => c.name.toLowerCase() === item.name.toLowerCase())?.color || '#6b7280' }}
                      ></div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* EMI Summary */}
          {analytics.totalEMIPayments > 0 && (
            <Card title="EMI Summary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total EMI Paid
                  </h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(analytics.totalEMIPayments)}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Net Cash Flow
                  </h3>
                  <p className={`text-2xl font-bold ${
                    analytics.incomeVsExpense.income > analytics.incomeVsExpense.expense 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(analytics.incomeVsExpense.income - analytics.incomeVsExpense.expense)}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Savings Rate
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.incomeVsExpense.income > 0 
                      ? `${Math.round((analytics.incomeVsExpense.income - analytics.incomeVsExpense.expense) / analytics.incomeVsExpense.income * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Analytics;
