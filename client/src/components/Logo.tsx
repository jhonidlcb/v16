import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = true, 
  textClassName = "",
  size = 'md'
}) => {

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const renderLogo = () => {
    return (
      <img 
        src="/logo-softwarepar.png"
        alt="SoftwarePar" 
        className={`${sizeClasses[size]} object-contain ${className}`}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      />
    );
  };

  return (
    <div className="flex items-center space-x-3">
      {renderLogo()}
      {showText && (
        <span className={`font-bold text-black ${textSizeClasses[size]} ${textClassName}`}>
          SoftwarePar
        </span>
      )}
    </div>
  );
};

export default Logo;