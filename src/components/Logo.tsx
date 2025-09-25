import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  show?: boolean;
}

const Logo: React.FC<LogoProps> = ({ show = true }) => {
  if (!show) return null;
  
  return (
    <motion.img
      src="/logo2.png"
      alt="HireMe Logo"
      style={{ 
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '120px',
        height: 'auto',
        zIndex: 1000
      }}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 2, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

export default Logo; 