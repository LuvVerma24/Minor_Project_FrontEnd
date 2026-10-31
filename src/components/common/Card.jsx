import React from 'react';

export const Card = ({ children, className = '', style, onClick, ...props }) => {
  return (
    <div
      className={`card ${className}`}
      style={{ ...style, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`card-title ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardSubtitle = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-subtitle ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
