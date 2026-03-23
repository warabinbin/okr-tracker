import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

const CONFETTI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ConfettiPieceProps {
  index: number;
}

function ConfettiPiece({ index }: ConfettiPieceProps) {
  const shapes = ['rounded-sm', 'rounded-full', 'rounded-none'];
  const shape = shapes[index % shapes.length];
  const size = index % 3 === 0 ? 'w-3 h-3' : index % 3 === 1 ? 'w-2 h-2' : 'w-1.5 h-3';
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = ((index * 37 + 13) % 100);
  const delay = (index * 0.05) % 0.8;

  return (
    <motion.div
      className={`absolute ${size} ${shape}`}
      style={{
        backgroundColor: color,
        left: `${left}%`,
        top: '-16px',
      }}
      animate={{
        y: '110vh',
        x: `${((index % 5) - 2) * 60}px`,
        rotate: index % 2 === 0 ? 720 : -720,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 1.8 + (index % 4) * 0.3,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  );
}

interface RitualOverlayProps {
  isOpen: boolean;
  krTitle: string;
  onClose: () => void;
}

export function RitualOverlay({ isOpen, krTitle, onClose }: RitualOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e1b4b 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Confetti */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 text-center"
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
          >
            <motion.div
              className="text-7xl mb-6 select-none"
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ delay: 0.4, duration: 0.6 }}
              aria-hidden="true"
            >
              ✨
            </motion.div>

            <motion.h1
              className="text-3xl font-bold text-white mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              KR達成！
            </motion.h1>

            <motion.p
              className="text-lg text-blue-200 mb-2 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              {krTitle}
            </motion.p>

            <motion.p
              className="text-sm text-blue-300 mb-10 max-w-xs leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
            >
              素晴らしい！目標を100%達成しました。この積み重ねが大きな成長につながります。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                size="lg"
                onClick={onClose}
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl px-10"
              >
                完了を記録
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
