import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { hashPassword, formatCurrency } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Navigation from '../components/Navigation';

const Profile = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [balance, setBalance] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      const userBalance = localStorage.getItem(`balance_${user.id}`);
      setBalance(parseFloat(userBalance) || 0);
    }
  }, [user]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        fullName: formData.fullName,
        email: formData.email
      };
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current user in auth context
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
      setErrors({});
    }
    
    setLoading(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    // Verify current password
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === user.id);
    
    if (currentUser && currentUser.password === hashPassword(passwordData.currentPassword)) {
      // Update password
      const userIndex = users.findIndex(u => u.id === user.id);
      users[userIndex].password = hashPassword(passwordData.newPassword);
      localStorage.setItem('users', JSON.stringify(users));
      
      showNotification('Password changed successfully!', 'success');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } else {
      setErrors({ currentPassword: 'Current password is incorrect' });
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showNotification('Logged out successfully', 'success');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <div className="max-w-4xl mx-auto">
        <Card title="Profile" className="mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
              
              {!isEditing ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Full Name:</span>
                    <p className="font-medium">{user.fullName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Username:</span>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Account Number:</span>
                    <p className="font-medium font-mono">{user.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Account Type:</span>
                    <p className="font-medium">{user.accountType || 'Savings'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Current Balance:</span>
                    <p className="font-bold text-green-600 text-xl">{formatCurrency(balance)}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    error={errors.fullName}
                    required
                  />
                  <Input
                    label="Username"
                    type="text"
                    name="username"
                    value={formData.username}
                    disabled
                    className="bg-gray-100"
                  />
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    error={errors.email}
                    required
                  />
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      loading={loading}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                        setFormData({
                          fullName: user.fullName,
                          email: user.email,
                          username: user.username
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
              
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="mt-4"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
              
              {!showPasswordForm ? (
                <div>
                  <p className="text-gray-600 mb-4">Change your password to keep your account secure</p>
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    variant="outline"
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    error={errors.currentPassword}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    error={errors.newPassword}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    error={errors.confirmPassword}
                    required
                  />
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      loading={loading}
                      className="flex-1"
                    >
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setErrors({});
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={handleLogout}
              variant="danger"
              className="w-full md:w-auto"
            >
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Profile;
