import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { hashPassword } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
    if (!formData.username.trim()) {
      newError.username = 'Username or email is required';
    }

    if (!formData.password.trim()) {
      newError.password = 'Password is required';
    }

    if (Object.keys(newError).length > 0) {
      setError(newError);
      setLoading(false);
      return;
    }

    // Check users in localStorage
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user by username or email
    const user = existingUsers.find(
      u => u.username === formData.username || u.email === formData.username
    );

    if (!user) {
      newError.username = 'Invalid credentials';
      setError(newError);
      setLoading(false);
      return;
    }

    // Check password
    const hashedPassword = hashPassword(formData.password);
    if (user.password !== hashedPassword) {
      newError.password = 'Invalid credentials';
      setError(newError);
      setLoading(false);
      return;
    }

    // Login successful
    login(user);
    showNotification('Login successful! Welcome back.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="mb-8">
          <div className="text-4xl mb-2">🏦</div>
          <h1 className="auth-title">Bank Simulation</h1>
          <p className="auth-subtitle">Secure access to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username or Email"
            className={`auth-input ${error.username ? 'border-red-500' : ''}`}
            required
          />
          {error.username && (
            <div className="text-red-500 text-sm mb-4 text-left">{error.username}</div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={`auth-input ${error.password ? 'border-red-500' : ''}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? '👁️' : '👁️'}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Secondary Action */}
        <div className="text-center">
          <p className="auth-link">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
