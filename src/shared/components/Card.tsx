import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  const base = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4';
  const hoverClass = hoverable ? 'cursor-pointer hover:shadow-md transition-shadow' : '';

  return (
    <motion.div
      className={`${base} ${hoverClass} ${className}`}
      onClick={onClick}
      whileHover={hoverable ? { y: -2 } : undefined}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
