
import React from 'react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const CyberButton: React.FC<CyberButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseClasses = "font-orbitron uppercase text-lg font-bold tracking-widest px-8 py-3 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variantClasses = {
    primary: "bg-cyan-500/10 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-stone-950",
    secondary: "bg-fuchsia-500/10 border-2 border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-fuchsia-100 hover:shadow-[0_0_15px_rgba(217,70,239,0.6)] focus:ring-2 focus:ring-fuchsia-300 focus:ring-offset-2 focus:ring-offset-stone-950"
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default CyberButton;
