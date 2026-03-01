import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DraggableModalWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const DraggableModalWrapper: React.FC<DraggableModalWrapperProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={twMerge("shadow-xl", className)}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from closing modal if backdrop has onClick
    >
      {children}
    </motion.div>
  );
};
