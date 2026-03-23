import type { Objective, KeyResult } from '../../shared/db';

/**
 * Calculate progress percentage for a single KeyResult (0-100).
 */
export function calcKeyResultProgress(kr: KeyResult): number {
  if (kr.targetValue === 0) return 0;
  const pct = (kr.currentValue / kr.targetValue) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Calculate overall progress for an Objective based on its KeyResults.
 * Returns the average progress across all KRs.
 */
export function calcObjectiveProgress(
  objective: Objective,
  keyResults: KeyResult[]
): number {
  const krs = keyResults.filter((kr) => kr.objectiveId === objective.id);
  if (krs.length === 0) return 0;
  const total = krs.reduce((sum, kr) => sum + calcKeyResultProgress(kr), 0);
  return total / krs.length;
}

/**
 * Aggregate overall portfolio progress across all active objectives.
 */
export function calcPortfolioProgress(
  objectives: Objective[],
  keyResults: KeyResult[]
): number {
  const active = objectives.filter((o) => o.status === 'active');
  if (active.length === 0) return 0;
  const total = active.reduce(
    (sum, o) => sum + calcObjectiveProgress(o, keyResults),
    0
  );
  return total / active.length;
}

/**
 * Returns the number of days remaining until dueDate.
 * Negative values indicate overdue.
 */
export function daysRemaining(dueDate: Date): number {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
