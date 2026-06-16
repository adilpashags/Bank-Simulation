import React from 'react';

const Card = ({ children, className = '', title, ...props }) => {
  return (
    <div 
      className={`glass-card ${className}`}
      {...props}
    >
      {title && (
        <h3 className="text-title">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;
