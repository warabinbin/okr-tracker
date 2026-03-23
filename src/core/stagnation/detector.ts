import type { KeyResult } from '../../shared/db';

const STAGNATION_THRESHOLD_DAYS = 7;

/**
 * Returns KeyResults that have had no activity for STAGNATION_THRESHOLD_DAYS days.
 */
export function detectStagnantKeyResults(keyResults: KeyResult[]): KeyResult[] {
  const now = new Date();
  return keyResults.filter((kr) => {
    if (kr.status === 'completed') return false;
    const diff = now.getTime() - new Date(kr.lastActivityAt).getTime();
    const daysSinceActivity = diff / (1000 * 60 * 60 * 24);
    return daysSinceActivity >= STAGNATION_THRESHOLD_DAYS;
  });
}

/**
 * Returns a human-readable label for how stale a KR is.
 */
export function stagnationLabel(kr: KeyResult): string {
  const now = new Date();
  const diff = now.getTime() - new Date(kr.lastActivityAt).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 30) return `${days}日間停滞中`;
  if (days >= 14) return `${days}日間停滞中`;
  return `${days}日間更新なし`;
}
