import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { hashPassword, generateAccountNumber, validateEmail } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  
  const handleSubmit = (e) => {
    e.preventDefault();
    const newError = {};
    setLoading(true);

    // Validation
    if (!formData.fullName.trim()) {
      newError.fullName = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newError.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newError.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newError.email = 'Please enter a valid email address';
    }

    if (formData.password.length < 6) {
      newError.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newError).length > 0) {
      setError(newError);
      setLoading(false);
      return;
    }

    // Check for existing users in localStorage
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check for duplicate username or email
    const duplicateUser = existingUsers.find(
      user => user.username === formData.username || user.email === formData.email
    );

    if (duplicateUser) {
      if (duplicateUser.username === formData.username) {
        newError.username = 'Username already exists';
      } else {
        newError.email = 'Email already registered';
      }
      setError(newError);
      setLoading(false);
      return;
    }

    // Generate random balance around 100,000 (between 90,000 and 110,000)
    const randomBalance = Math.floor(Math.random() * 20001) + 90000;

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: hashPassword(formData.password), // Hash the password
      accountNumber: generateAccountNumber(),
      accountType: 'Savings',
      createdAt: new Date().toISOString()
    };

    // Save user to localStorage
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));

    // Set initial balance for the new user
    localStorage.setItem(`balance_${newUser.id}`, randomBalance.toString());

    // Auto-login and redirect
    login(newUser);
    showNotification(`Account created successfully! Your initial balance is $${randomBalance.toLocaleString()}. Account Number: ${newUser.accountNumber}`, 'success');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="mb-8">
          <div className="text-4xl mb-2">🏦</div>
          <h1 className="auth-title">Bank Simulation</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className={`auth-input ${error.fullName ? 'border-red-500' : ''}`}
            required
          />
          {error.fullName && (
            <div className="text-red-500 text-sm mb-4 text-left">{error.fullName}</div>
          )}

          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className={`auth-input ${error.username ? 'border-red-500' : ''}`}
            required
          />
          {error.username && (
            <div className="text-red-500 text-sm mb-4 text-left">{error.username}</div>
          )}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className={`auth-input ${error.email ? 'border-red-500' : ''}`}
            required
          />
          {error.email && (
            <div className="text-red-500 text-sm mb-4 text-left">{error.email}</div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (min 6 characters)"
              className={`auth-input ${error.password ? 'border-red-500' : ''}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? '👁️' : '👂️'}
            </button>
          </div>
          {error.password && (
            <div className="text-red-500 text-sm mb-4 text-left">{error.password}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Secondary Action */}
        <div className="text-center">
          <p className="auth-link">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
