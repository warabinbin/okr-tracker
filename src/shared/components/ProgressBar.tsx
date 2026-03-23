import * as Progress from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'orange' | 'red';
}

const sizeClass = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClass = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

export function ProgressBar({
  value,
  label,
  size = 'md',
  color = 'blue',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span>{clamped.toFixed(0)}%</span>
        </div>
      )}
      <Progress.Root
        className={`relative overflow-hidden rounded-full bg-gray-200 w-full ${sizeClass[size]}`}
        value={clamped}
      >
        <Progress.Indicator asChild>
          <motion.div
            className={`h-full rounded-full ${colorClass[color]}`}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </Progress.Indicator>
      </Progress.Root>
    </div>
  );
}
