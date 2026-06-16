import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', badge: null },
    { path: '/transactions', label: 'Transactions', icon: '💰', badge: null },
    { path: '/loans', label: 'Loans', icon: '🏦', badge: null },
    { path: '/bill-payment', label: 'Bills', icon: '📄', badge: null },
    { path: '/analytics', label: 'Analytics', icon: '📊', badge: null },
    { path: '/fraud-monitor', label: 'Security', icon: '🛡️', badge: 'high' },
    { path: '/advisor', label: 'Advisor', icon: '🤖', badge: null },
    { path: '/profile', label: 'Profile', icon: '👤', badge: null }
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12v8M12 8v8m0 0h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        md:relative md:translate-x-0 md:opacity-100 md:pointer-events-auto
        w-64 h-full bg-sidebar text-white dark:text-gray-100
      `}>
        
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-3 text-white dark:text-gray-100 hover:text-gray-200">
            <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">🏦</span>
            </div>
            <span className="text-xl font-bold">BankSim</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-white dark:bg-gray-800 text-sidebar'
                      : 'text-gray-300 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-sidebar'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-1 text-xs rounded-full ${item.badge}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-white dark:text-gray-100">{user?.fullName}</div>
              <div className="text-xs text-gray-300 dark:text-gray-400">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle theme"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-white">
                <div className="text-center mb-8">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Menu</h3>
              </div>
              <nav className="w-full">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                          isActive(item.path)
                            ? 'bg-white dark:bg-gray-800 text-sidebar'
                            : 'text-gray-300 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-sidebar'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
