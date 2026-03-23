import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOkrStore } from '../../shared/store';
import { useSettingsStore } from '../../shared/store';
import { useKeyResults } from '../../shared/hooks';
import { calcPortfolioProgress, calcObjectiveProgress } from '../../core/okr';
import { daysRemaining } from '../../core/okr/progress';
import { Card, ProgressBar, Badge, EmptyState, BottomSheet } from '../../shared/components';
import type { KeyResult } from '../../shared/db';

// ─── Focus KR extraction ────────────────────────────────────────────────────

interface FocusKR {
  kr: KeyResult;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

function extractFocusKRs(keyResults: KeyResult[], thresholdDays: number, limit = 3): FocusKR[] {
  const active = keyResults.filter((kr) => kr.status !== 'completed');
  const now = new Date();

  const scored = active.map((kr) => {
    const days = daysRemaining(new Date(kr.dueDate));
    const lastActivity = new Date(kr.lastActivityAt);
    const staleDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;

    let score = 0;
    let reason = '';
    let urgency: 'high' | 'medium' | 'low' = 'low';

    if (days <= 3 && days >= 0) {
      score += 100;
      reason = `期限${days}日前`;
      urgency = 'high';
    } else if (days < 0) {
      score += 120;
      reason = `期限超過`;
      urgency = 'high';
    } else if (staleDays >= thresholdDays) {
      score += 80;
      reason = `${staleDays}日間未更新`;
      urgency = staleDays >= 30 ? 'high' : 'medium';
    } else if (days <= 7) {
      score += 70;
      reason = `期限${days}日前`;
      urgency = 'medium';
    } else if (pct < 20 && days <= 30) {
      score += 50;
      reason = '進捗が遅れ気味';
      urgency = 'medium';
    } else {
      score += 20;
      reason = '継続中';
      urgency = 'low';
    }

    return { kr, score, reason, urgency };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ kr, reason, urgency }) => ({ kr, reason, urgency }));
}

// ─── Progress Update Sheet ───────────────────────────────────────────────────

interface ProgressSheetProps {
  kr: KeyResult | null;
  onClose: () => void;
  onUpdate: (id: number, currentValue: number) => void;
}

function ProgressSheet({ kr, onClose, onUpdate }: ProgressSheetProps) {
  const [value, setValue] = useState<number>(kr?.currentValue ?? 0);

  if (!kr) return null;

  const pct = kr.targetValue > 0 ? Math.round((value / kr.targetValue) * 100) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpdate(kr!.id!, value);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm text-gray-500 mb-1">KR</p>
        <p className="font-medium text-gray-900">{kr.title}</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-3xl font-bold text-blue-600">{pct}%</span>
          <span className="text-sm text-gray-500">
            {value} / {kr.targetValue} {kr.unit}
          </span>
        </div>
        <ProgressBar value={pct} size="lg" color="blue" />
      </div>

      <div>
        <label htmlFor="current-value" className="block text-sm font-medium text-gray-700 mb-2">
          現在の値
        </label>
        <input
          id="current-value"
          type="number"
          value={value}
          min={0}
          max={kr.targetValue}
          step={1}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <input
          type="range"
          value={value}
          min={0}
          max={kr.targetValue}
          step={1}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full mt-3 accent-blue-600"
          aria-label="スライダーで進捗を調整"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          更新する
        </button>
      </div>
    </form>
  );
}

// ─── Stagnation Alert Banner ─────────────────────────────────────────────────

interface StagnationBannerProps {
  stagnantKRs: KeyResult[];
  onUpdate: (kr: KeyResult) => void;
  onExtend: (kr: KeyResult) => void;
  onDelete: (kr: KeyResult) => void;
}

function StagnationBanner({ stagnantKRs, onUpdate, onExtend, onDelete }: StagnationBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? stagnantKRs : stagnantKRs.slice(0, 1);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-orange-500 text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-orange-800 text-sm mb-0.5">先延ばしアラート</h3>
          <p className="text-xs text-orange-600 mb-3">
            {stagnantKRs.length}件のKRが長期間更新されていません
          </p>

          <div className="space-y-3">
            {shown.map((kr) => {
              const now = new Date();
              const staleDays = Math.floor(
                (now.getTime() - new Date(kr.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={kr.id} className="bg-white/70 rounded-xl p-3">
                  <p className="text-sm font-medium text-orange-900 mb-2 leading-tight">{kr.title}</p>
                  <p className="text-xs text-orange-500 mb-2">{staleDays}日間未更新</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdate(kr)}
                      className="flex-1 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                    >
                      更新する
                    </button>
                    <button
                      onClick={() => onExtend(kr)}
                      className="flex-1 py-2 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors min-h-[44px]"
                    >
                      期限変更
                    </button>
                    <button
                      onClick={() => onDelete(kr)}
                      className="flex-1 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[44px]"
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {stagnantKRs.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-orange-600 font-medium hover:text-orange-800 transition-colors"
            >
              {expanded ? '折りたたむ' : `他${stagnantKRs.length - 1}件を表示`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Focus KR Card ────────────────────────────────────────────────────────────

interface FocusCardProps {
  focusKr: FocusKR;
  objectiveTitle: string;
  onTap: (kr: KeyResult) => void;
}

function FocusCard({ focusKr, objectiveTitle, onTap }: FocusCardProps) {
  const { kr, reason, urgency } = focusKr;
  const pct = kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0;

  const urgencyColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-400',
    low: 'bg-blue-400',
  };

  const reasonColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <motion.button
      onClick={() => onTap(kr)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      aria-label={`${kr.title} - タップして進捗更新`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${reasonColors[urgency]}`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${urgencyColors[urgency]} inline-block`}
            aria-hidden="true"
          />
          {reason}
        </span>
        <span className="text-lg font-bold text-blue-600">{pct}%</span>
      </div>

      <p className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
        {kr.title}
      </p>
      <p className="text-xs text-gray-400 mb-3">{objectiveTitle}</p>

      <ProgressBar
        value={pct}
        size="sm"
        color={pct >= 70 ? 'green' : pct >= 40 ? 'blue' : 'orange'}
      />

      <p className="text-xs text-gray-400 mt-2">
        {kr.currentValue} / {kr.targetValue} {kr.unit}
      </p>
    </motion.button>
  );
}

// ─── Extend Due Date Sheet ───────────────────────────────────────────────────

interface ExtendDueDateSheetProps {
  kr: KeyResult | null;
  onClose: () => void;
  onExtend: (id: number, newDate: Date) => void;
}

function ExtendDueDateSheet({ kr, onClose, onExtend }: ExtendDueDateSheetProps) {
  const [date, setDate] = useState(() => {
    if (!kr) return '';
    const d = new Date(kr.dueDate);
    return d.toISOString().split('T')[0];
  });

  if (!kr) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onExtend(kr!.id!, new Date(date));
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-700">{kr.title}</p>
      <div>
        <label htmlFor="new-due-date" className="block text-sm font-medium text-gray-700 mb-2">
          新しい期限
        </label>
        <input
          id="new-due-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          変更する
        </button>
      </div>
    </form>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function statusBadgeVariant(pct: number): 'success' | 'warning' | 'danger' | 'info' {
  if (pct >= 70) return 'success';
  if (pct >= 40) return 'info';
  if (pct >= 20) return 'warning';
  return 'danger';
}

export function DashboardPage() {
  const { objectives, keyResults } = useOkrStore();
  const { stagnationThresholdDays } = useSettingsStore();
  const { update, remove } = useKeyResults();

  const [progressKR, setProgressKR] = useState<KeyResult | null>(null);
  const [extendKR, setExtendKR] = useState<KeyResult | null>(null);

  const activeObjectives = objectives.filter((o) => o.status === 'active');
  const portfolioPct = calcPortfolioProgress(objectives, keyResults);

  const stagnantKRs = keyResults.filter((kr) => {
    if (kr.status === 'completed') return false;
    const now = new Date();
    const diff = now.getTime() - new Date(kr.lastActivityAt).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= stagnationThresholdDays;
  });

  const focusKRs = extractFocusKRs(keyResults, stagnationThresholdDays);

  function getObjectiveTitle(objectiveId: number) {
    return objectives.find((o) => o.id === objectiveId)?.title ?? '';
  }

  async function handleProgressUpdate(id: number, currentValue: number) {
    const kr = keyResults.find((k) => k.id === id);
    if (!kr) return;
    const newStatus = currentValue >= kr.targetValue ? 'completed' : kr.status;
    await update(id, { currentValue, status: newStatus });
  }

  async function handleExtend(id: number, newDate: Date) {
    await update(id, { dueDate: newDate });
  }

  async function handleDelete(kr: KeyResult) {
    if (confirm(`「${kr.title}」を削除しますか？`)) {
      await remove(kr.id!);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-0.5">今日の進捗を確認しましょう</p>
      </div>

      {/* Today's 3 Focus Cards */}
      {focusKRs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            今日の3フォーカス
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            {focusKRs.map((fkr) => (
              <motion.div key={fkr.kr.id} variants={item}>
                <FocusCard
                  focusKr={fkr}
                  objectiveTitle={getObjectiveTitle(fkr.kr.objectiveId)}
                  onTap={(kr) => setProgressKR(kr)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Stagnation Alert Banner */}
      {stagnantKRs.length > 0 && (
        <StagnationBanner
          stagnantKRs={stagnantKRs}
          onUpdate={(kr) => setProgressKR(kr)}
          onExtend={(kr) => setExtendKR(kr)}
          onDelete={handleDelete}
        />
      )}

      {/* Portfolio Progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">全体進捗</h2>
          <span className="text-2xl font-bold text-blue-600">{portfolioPct.toFixed(0)}%</span>
        </div>
        <ProgressBar value={portfolioPct} size="lg" color="blue" />
        <div className="mt-3 flex gap-4 text-sm text-gray-500">
          <span>{activeObjectives.length} 目標</span>
          <span>{keyResults.length} KR</span>
        </div>
      </Card>

      {/* OKR Progress Cards */}
      {activeObjectives.length === 0 ? (
        <EmptyState
          title="目標がありません"
          description="まず目標（Objective）を追加して、成長トラッキングを始めましょう。"
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <h2 className="font-semibold text-gray-800">目標一覧</h2>
          {activeObjectives.map((obj) => {
            const pct = calcObjectiveProgress(obj, keyResults);
            const krs = keyResults.filter((kr) => kr.objectiveId === obj.id);
            return (
              <motion.div key={obj.id} variants={item}>
                <Card hoverable>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{obj.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{obj.quarter}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(pct)}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <ProgressBar value={pct} size="sm" color={pct >= 70 ? 'green' : pct >= 40 ? 'blue' : 'orange'} />
                  <p className="text-xs text-gray-400 mt-2">{krs.length} KR</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Progress Update Sheet */}
      <BottomSheet
        isOpen={progressKR !== null}
        onClose={() => setProgressKR(null)}
        title="進捗を更新"
      >
        <ProgressSheet
          kr={progressKR}
          onClose={() => setProgressKR(null)}
          onUpdate={handleProgressUpdate}
        />
      </BottomSheet>

      {/* Extend Due Date Sheet */}
      <BottomSheet
        isOpen={extendKR !== null}
        onClose={() => setExtendKR(null)}
        title="期限を変更"
      >
        <ExtendDueDateSheet
          kr={extendKR}
          onClose={() => setExtendKR(null)}
          onExtend={handleExtend}
        />
      </BottomSheet>
    </div>
  );
}
