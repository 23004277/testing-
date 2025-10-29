import React, { useState, useEffect } from 'react';

interface CustomCursorProps {
  isShooting: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ isShooting }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };
    
    const handleMouseLeave = () => {
        setIsVisible(false);
    }

    window.addEventListener('mousemove', updatePosition);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  const cursorClasses = `custom-cursor ${isShooting ? 'shooting' : ''}`;

  return (
    <div
      className={cursorClasses}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>
      <div className="cursor-line cursor-top"></div>
      <div className="cursor-line cursor-bottom"></div>
      <div className="cursor-line cursor-left"></div>
      <div className="cursor-line cursor-right"></div>
    </div>
  );
};

export default CustomCursor;
