import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import TransactionHistory from './pages/TransactionHistory';
import ApplyLoan from './pages/ApplyLoan';
import MyLoans from './pages/MyLoans';
import BillPayment from './pages/BillPayment';
import BillHistory from './pages/BillHistory';
import CreditScore from './pages/CreditScore';
import EmiPlanner from './pages/EmiPlanner';
import LoanEligibility from './pages/LoanEligibility';
import FraudMonitor from './pages/FraudMonitor';
import Analytics from './pages/Analytics';
import FinancialAdvisor from './pages/FinancialAdvisor';
import ProtectedRoute from './components/ProtectedRoute';
import Notification from './components/Notification';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <Notification />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Transactions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transaction-history" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <TransactionHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apply-loan" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ApplyLoan />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/loans" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MyLoans />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bill-payment" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BillPayment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bill-history" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <BillHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/credit-score" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <CreditScore />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/emi-planner" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <EmiPlanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/loan-eligibility" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <LoanEligibility />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fraud-monitor" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <FraudMonitor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/advisor" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <FinancialAdvisor />
            </ProtectedRoute>
          } 
        />
        
        
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
