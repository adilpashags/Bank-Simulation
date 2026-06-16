import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'transition-all duration-200';
  
  const errorClasses = error ? 'border-red-500' : 'border-glass-border-light dark:border-glass-border-dark';
  
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-label mb-2">
          {label}
          {required && <span className="status-error ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`glass-input ${errorClasses} ${className}`}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm status-error">{error}</p>
      )}
    </div>
  );
};

export default Input;
