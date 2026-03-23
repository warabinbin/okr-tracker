import type { Action, KeyResult } from '../../shared/db';
import { calcKeyResultProgress, daysRemaining } from '../okr/progress';

interface ScoredAction {
  action: Action;
  score: number;
}

/**
 * Score each action based on:
 *  - Priority (high=3, medium=2, low=1)
 *  - KR urgency (days remaining)
 *  - KR progress (prefer lower progress = more needed)
 *  - Status (prefer todo > in_progress)
 */
function scoreAction(
  action: Action,
  keyResults: KeyResult[]
): number {
  const priorityScore = action.priority === 'high' ? 3 : action.priority === 'medium' ? 2 : 1;
  const kr = keyResults.find((k) => k.id === action.keyResultId);

  let urgencyScore = 0;
  let progressGapScore = 0;

  if (kr) {
    const days = daysRemaining(kr.dueDate);
    urgencyScore = days <= 7 ? 3 : days <= 14 ? 2 : 1;
    const pct = calcKeyResultProgress(kr);
    progressGapScore = pct < 30 ? 3 : pct < 70 ? 2 : 1;
  }

  const statusScore = action.status === 'todo' ? 2 : action.status === 'in_progress' ? 3 : 0;

  return priorityScore * 0.35 + urgencyScore * 0.35 + progressGapScore * 0.2 + statusScore * 0.1;
}

/**
 * Extract top 3 focus actions for the day.
 */
export function extractDailyFocus(
  actions: Action[],
  keyResults: KeyResult[],
  limit = 3
): Action[] {
  const eligible = actions.filter(
    (a) => a.status === 'todo' || a.status === 'in_progress'
  );

  const scored: ScoredAction[] = eligible.map((a) => ({
    action: a,
    score: scoreAction(a, keyResults),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.action);
}
