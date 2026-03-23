import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOkrStore } from '../../shared/store';
import { useKeyResults } from '../../shared/hooks';
import { Card, RitualOverlay } from '../../shared/components';

const CONFETTI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: `${(i * 37 + 13) % 100}%`,
            top: '-10px',
          }}
          animate={{
            y: '110vh',
            x: `${((i % 5) - 2) * 60}px`,
            rotate: i % 2 === 0 ? 720 : -720,
          }}
          transition={{
            duration: 1.5 + (i % 4) * 0.3,
            delay: (i * 0.05) % 0.6,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

export function RitualPage() {
  const { objectives, keyResults } = useOkrStore();
  const { update } = useKeyResults();

  const [celebrating, setCelebrating] = useState(false);
  const [ritualKRTitle, setRitualKRTitle] = useState<string | null>(null);

  const completedKRs = keyResults.filter((kr) => kr.status === 'completed');
  const activeKRs = keyResults.filter((kr) => kr.status !== 'completed');

  function getObjectiveTitle(objectiveId: number) {
    return objectives.find((o) => o.id === objectiveId)?.title ?? '';
  }

  async function handleMarkComplete(krId: number) {
    const kr = keyResults.find((k) => k.id === krId);
    if (!kr) return;
    await update(krId, { currentValue: kr.targetValue, status: 'completed' });
    setRitualKRTitle(kr.title);
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 2500);
  }

  const allDone = activeKRs.length === 0 && keyResults.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <AnimatePresence>{celebrating && <Confetti />}</AnimatePresence>

      <RitualOverlay
        isOpen={ritualKRTitle !== null}
        krTitle={ritualKRTitle ?? ''}
        onClose={() => setRitualKRTitle(null)}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">完了儀式</h1>
        <p className="text-sm text-gray-500 mt-0.5">KRを完了してお祝いしましょう</p>
      </div>

      {/* Stats */}
      {keyResults.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completedKRs.length}</p>
            <p className="text-sm text-green-700 mt-0.5">達成済みKR</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{activeKRs.length}</p>
            <p className="text-sm text-blue-700 mt-0.5">進行中KR</p>
          </div>
        </div>
      )}

      {/* All Done */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-7xl mb-4" aria-label="全完了">
            ✨
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">全KR達成！</h2>
          <p className="text-gray-500">全ての目標KRを達成しました。素晴らしい成果です！</p>
        </motion.div>
      )}

      {/* No KRs */}
      {keyResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4" aria-hidden="true">🎯</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">KRがありません</h2>
          <p className="text-sm text-gray-500">目標ページからKRを追加してください。</p>
        </div>
      )}

      {/* Active KRs */}
      {activeKRs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">進行中のKR</h2>
          <AnimatePresence>
            {activeKRs.map((kr) => {
              const pct = kr.targetValue > 0
                ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
                : 0;
              return (
                <motion.div
                  key={kr.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                >
                  <Card>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleMarkComplete(kr.id!)}
                        className="w-7 h-7 rounded-full border-2 border-blue-400 flex-shrink-0 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mt-0.5"
                        aria-label={`「${kr.title}」を完了にする`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{kr.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{getObjectiveTitle(kr.objectiveId)}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed KRs */}
      {completedKRs.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-800">達成済み ✓</h2>
          {completedKRs.map((kr) => (
            <div
              key={kr.id}
              className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-100"
            >
              <span className="text-green-500 flex-shrink-0" aria-hidden="true">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 line-through opacity-70">{kr.title}</p>
                <p className="text-xs text-green-600">{getObjectiveTitle(kr.objectiveId)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
