import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/transactions', label: 'Transactions', icon: '💰' },
    { path: '/loans', label: 'Loans', icon: '🏦' },
    { path: '/bill-payment', label: 'Bills', icon: '📄' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/fraud-monitor', label: 'Fraud Monitor', icon: '🛡️' },
    { path: '/advisor', label: 'Financial Advisor', icon: '🤖' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: '🧠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="glass-nav">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary-light dark:text-primary-dark">
              🏦 BankSim
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center nav-scroll">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`glass-button glass-button-sm ${
                  isActive(item.path)
                    ? 'glass-button-primary'
                    : ''
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="glass-button glass-button-sm"
              title="Toggle theme"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            <span className="text-label">Welcome, {user?.fullName}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="glass-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-glass-border-light dark:border-glass-border-dark">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`glass-button glass-button-sm ${
                isActive(item.path)
                  ? 'glass-button-primary'
                  : ''
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
