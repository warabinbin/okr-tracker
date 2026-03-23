import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOkrStore } from '../../shared/store';
import { useObjectives, useKeyResults } from '../../shared/hooks';
import { calcObjectiveProgress, calcKeyResultProgress } from '../../core/okr';
import { daysRemaining } from '../../core/okr/progress';
import {
  Card,
  ProgressBar,
  Badge,
  Button,
  EmptyState,
  BottomSheet,
  RitualOverlay,
} from '../../shared/components';
import type { ObjectiveInput } from '../../shared/db/validators';
import type { KeyResult } from '../../shared/db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function QuarterLabel({ quarter }: { quarter: string }) {
  return (
    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
      {quarter}
    </span>
  );
}

function dueDateLabel(dueDate: Date): { text: string; color: string } {
  const days = daysRemaining(new Date(dueDate));
  if (days < 0) return { text: `${Math.abs(days)}日超過`, color: 'text-red-600' };
  if (days === 0) return { text: '今日が期限', color: 'text-red-500' };
  if (days <= 3) return { text: `残${days}日`, color: 'text-orange-500' };
  if (days <= 7) return { text: `残${days}日`, color: 'text-yellow-600' };
  return {
    text: new Date(dueDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    color: 'text-gray-400',
  };
}

// ─── Add Objective Form ───────────────────────────────────────────────────────

interface AddObjectiveFormProps {
  onSubmit: (data: ObjectiveInput) => void;
  onCancel: () => void;
}

function AddObjectiveForm({ onSubmit, onCancel }: AddObjectiveFormProps) {
  const currentQuarter = (() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `${now.getFullYear()}Q${q}`;
  })();

  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState(currentQuarter);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ title, quarter, status: 'active' });
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="obj-title" className="block text-sm font-medium text-gray-700 mb-1.5">
          目標タイトル
        </label>
        <input
          id="obj-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 英語力をビジネスレベルに引き上げる"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="obj-quarter" className="block text-sm font-medium text-gray-700 mb-1.5">
          クォーター
        </label>
        <input
          id="obj-quarter"
          type="text"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          placeholder="2026Q2"
          pattern="\d{4}Q[1-4]"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          required
        />
        <p className="text-xs text-gray-400 mt-1">例: 2026Q2</p>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          追加
        </button>
      </div>
    </form>
  );
}

// ─── Add KR Form ──────────────────────────────────────────────────────────────

interface AddKRFormProps {
  objectiveId: number;
  onSubmit: (data: {
    objectiveId: number;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    dueDate: Date;
    status: 'on_track';
  }) => void;
  onCancel: () => void;
}

function AddKRForm({ objectiveId, onSubmit, onCancel }: AddKRFormProps) {
  const defaultDue = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  })();

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number>(100);
  const [unit, setUnit] = useState('%');
  const [dueDate, setDueDate] = useState(defaultDue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      objectiveId,
      title,
      targetValue,
      currentValue: 0,
      unit,
      dueDate: new Date(dueDate),
      status: 'on_track',
    });
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="kr-title" className="block text-sm font-medium text-gray-700 mb-1.5">
          KRタイトル
        </label>
        <input
          id="kr-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: TOEIC スコアを 800 点以上取得"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="kr-target" className="block text-sm font-medium text-gray-700 mb-1.5">
            目標値
          </label>
          <input
            id="kr-target"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            min={1}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="kr-unit" className="block text-sm font-medium text-gray-700 mb-1.5">
            単位
          </label>
          <input
            id="kr-unit"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="点 / 回 / %"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="kr-due" className="block text-sm font-medium text-gray-700 mb-1.5">
          期限
        </label>
        <input
          id="kr-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          追加
        </button>
      </div>
    </form>
  );
}

// ─── KR Progress Slider ───────────────────────────────────────────────────────

interface KRProgressSheetProps {
  kr: KeyResult | null;
  onClose: () => void;
  onUpdate: (id: number, currentValue: number) => void;
}

function KRProgressSheet({ kr, onClose, onUpdate }: KRProgressSheetProps) {
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
        <p className="text-xs text-gray-400 mb-1">KR</p>
        <p className="font-medium text-gray-900 leading-snug">{kr.title}</p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-4xl font-bold text-blue-600">{pct}%</span>
          <span className="text-sm text-gray-500">
            {value} / {kr.targetValue} {kr.unit}
          </span>
        </div>
        <ProgressBar value={pct} size="lg" color="blue" />
      </div>

      <div>
        <label htmlFor="kr-slider-value" className="block text-sm font-medium text-gray-700 mb-2">
          現在の値
        </label>
        <input
          id="kr-slider-value"
          type="number"
          value={value}
          min={0}
          max={kr.targetValue}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="range"
          value={value}
          min={0}
          max={kr.targetValue}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full mt-3 accent-blue-600"
          aria-label="スライダーで進捗調整"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>{kr.targetValue} {kr.unit}</span>
        </div>
      </div>

      {pct >= 100 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-sm font-medium text-green-700">100%達成！完了儀式が発動します ✨</p>
        </div>
      )}

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
          更新する
        </button>
      </div>
    </form>
  );
}

// ─── KR Card ──────────────────────────────────────────────────────────────────

interface KRCardProps {
  kr: KeyResult;
  onUpdate: (kr: KeyResult) => void;
  onDelete: (kr: KeyResult) => void;
}

function KRCard({ kr, onUpdate, onDelete }: KRCardProps) {
  const pct = calcKeyResultProgress(kr);
  const { text: dueText, color: dueColor } = dueDateLabel(new Date(kr.dueDate));

  const statusLabel: Record<KeyResult['status'], string> = {
    on_track: '順調',
    at_risk: '注意',
    behind: '遅延',
    completed: '完了',
  };

  const statusVariant: Record<KeyResult['status'], 'success' | 'warning' | 'danger' | 'info'> = {
    on_track: 'info',
    at_risk: 'warning',
    behind: 'danger',
    completed: 'success',
  };

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug">{kr.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[kr.status]}>{statusLabel[kr.status]}</Badge>
            <span className={`text-xs ${dueColor}`}>{dueText}</span>
          </div>
        </div>
        <span className="text-base font-bold text-blue-600 flex-shrink-0">{pct.toFixed(0)}%</span>
      </div>

      <ProgressBar
        value={pct}
        size="sm"
        color={pct >= 100 ? 'green' : pct >= 50 ? 'blue' : 'orange'}
      />

      <p className="text-xs text-gray-400 mt-1.5 mb-3">
        {kr.currentValue} / {kr.targetValue} {kr.unit}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onUpdate(kr)}
          disabled={kr.status === 'completed'}
          className="flex-1 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          進捗更新
        </button>
        <button
          onClick={() => onDelete(kr)}
          className="px-3 py-2.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[44px]"
          aria-label="KRを削除"
        >
          削除
        </button>
      </div>
    </div>
  );
}

// ─── Objective Card with KR List ──────────────────────────────────────────────

interface ObjectiveCardProps {
  objectiveId: number;
  title: string;
  quarter: string;
  pct: number;
  krs: KeyResult[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddKR: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onUpdateKR: (kr: KeyResult) => void;
  onDeleteKR: (kr: KeyResult) => void;
}

function ObjectiveCard({
  title,
  quarter,
  pct,
  krs,
  isExpanded,
  onToggle,
  onAddKR,
  onArchive,
  onDelete,
  onUpdateKR,
  onDeleteKR,
}: ObjectiveCardProps) {
  return (
    <Card>
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full text-left focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <QuarterLabel quarter={quarter} />
              <span className="text-xs text-gray-400">{krs.length} KR</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={pct >= 70 ? 'success' : pct >= 40 ? 'info' : 'warning'}>
              {pct.toFixed(0)}%
            </Badge>
            <span className="text-gray-400 text-sm" aria-hidden="true">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>
        <ProgressBar value={pct} size="sm" />
      </button>

      {/* KR list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {krs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  KRがありません。追加してください。
                </p>
              ) : (
                krs.map((kr) => (
                  <KRCard
                    key={kr.id}
                    kr={kr}
                    onUpdate={onUpdateKR}
                    onDelete={onDeleteKR}
                  />
                ))
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button size="sm" onClick={onAddKR} className="flex-1">
                + KR追加
              </Button>
              <Button variant="ghost" size="sm" onClick={onArchive}>
                アーカイブ
              </Button>
              <Button variant="danger" size="sm" onClick={onDelete}>
                削除
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Main ObjectivesPage ──────────────────────────────────────────────────────

export function ObjectivesPage() {
  const { objectives, keyResults } = useOkrStore();
  const { create: createObjective, update: updateObjective, remove: removeObjective } = useObjectives();
  const { create: createKR, update: updateKR, remove: removeKR } = useKeyResults();

  const [showAddObjective, setShowAddObjective] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [addKRObjectiveId, setAddKRObjectiveId] = useState<number | null>(null);
  const [progressKR, setProgressKR] = useState<KeyResult | null>(null);
  const [ritualKRTitle, setRitualKRTitle] = useState<string | null>(null);

  const active = objectives.filter((o) => o.status === 'active');
  const archived = objectives.filter((o) => o.status === 'archived');

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateObjective(data: ObjectiveInput) {
    await createObjective(data);
    setShowAddObjective(false);
  }

  async function handleArchive(id: number) {
    await updateObjective(id, { status: 'archived' });
  }

  async function handleDeleteObjective(id: number) {
    if (confirm('この目標を削除しますか？関連するKRも全て削除されます。')) {
      await removeObjective(id);
    }
  }

  async function handleAddKR(data: Parameters<typeof createKR>[0]) {
    await createKR(data);
    setAddKRObjectiveId(null);
  }

  async function handleUpdateKRProgress(id: number, currentValue: number) {
    const kr = keyResults.find((k) => k.id === id);
    if (!kr) return;
    const isCompleted = currentValue >= kr.targetValue;
    const newStatus: KeyResult['status'] = isCompleted ? 'completed' : 'on_track';
    await updateKR(id, { currentValue, status: newStatus });
    if (isCompleted) {
      setRitualKRTitle(kr.title);
    }
  }

  async function handleDeleteKR(kr: KeyResult) {
    if (confirm(`「${kr.title}」を削除しますか？`)) {
      await removeKR(kr.id!);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">目標 (OKR)</h1>
        <Button size="sm" onClick={() => setShowAddObjective(true)} disabled={showAddObjective}>
          + 目標追加
        </Button>
      </div>

      {/* Add Objective Sheet */}
      <BottomSheet
        isOpen={showAddObjective}
        onClose={() => setShowAddObjective(false)}
        title="目標を追加"
      >
        <AddObjectiveForm
          onSubmit={handleCreateObjective}
          onCancel={() => setShowAddObjective(false)}
        />
      </BottomSheet>

      {/* Add KR Sheet */}
      <BottomSheet
        isOpen={addKRObjectiveId !== null}
        onClose={() => setAddKRObjectiveId(null)}
        title="KR（主要成果）を追加"
      >
        {addKRObjectiveId !== null && (
          <AddKRForm
            objectiveId={addKRObjectiveId}
            onSubmit={handleAddKR}
            onCancel={() => setAddKRObjectiveId(null)}
          />
        )}
      </BottomSheet>

      {/* KR Progress Sheet */}
      <BottomSheet
        isOpen={progressKR !== null}
        onClose={() => setProgressKR(null)}
        title="進捗を更新"
      >
        <KRProgressSheet
          kr={progressKR}
          onClose={() => setProgressKR(null)}
          onUpdate={handleUpdateKRProgress}
        />
      </BottomSheet>

      {/* Ritual Overlay */}
      <RitualOverlay
        isOpen={ritualKRTitle !== null}
        krTitle={ritualKRTitle ?? ''}
        onClose={() => setRitualKRTitle(null)}
      />

      {/* Active Objectives */}
      {active.length === 0 && !showAddObjective ? (
        <EmptyState
          title="アクティブな目標がありません"
          description="「+ 目標追加」から最初の目標を作成しましょう。"
          action={
            <Button onClick={() => setShowAddObjective(true)}>目標を追加する</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {active.map((obj) => {
            const pct = calcObjectiveProgress(obj, keyResults);
            const krs = keyResults.filter((kr) => kr.objectiveId === obj.id);
            return (
              <ObjectiveCard
                key={obj.id}
                objectiveId={obj.id!}
                title={obj.title}
                quarter={obj.quarter}
                pct={pct}
                krs={krs}
                isExpanded={expandedIds.has(obj.id!)}
                onToggle={() => toggleExpand(obj.id!)}
                onAddKR={() => setAddKRObjectiveId(obj.id!)}
                onArchive={() => handleArchive(obj.id!)}
                onDelete={() => handleDeleteObjective(obj.id!)}
                onUpdateKR={(kr) => setProgressKR(kr)}
                onDeleteKR={handleDeleteKR}
              />
            );
          })}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 py-2">
            アーカイブ済み ({archived.length})
          </summary>
          <div className="mt-3 space-y-2">
            {archived.map((obj) => (
              <Card key={obj.id} className="opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{obj.title}</span>
                  <QuarterLabel quarter={obj.quarter} />
                </div>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
