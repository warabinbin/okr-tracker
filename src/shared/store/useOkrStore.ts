import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Objective, KeyResult, Action, ActionLog, DailyFocus } from '../db';

interface OkrState {
  objectives: Objective[];
  keyResults: KeyResult[];
  actions: Action[];
  actionLogs: ActionLog[];
  dailyFocus: DailyFocus | null;
  selectedObjectiveId: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setObjectives: (objectives: Objective[]) => void;
  setKeyResults: (keyResults: KeyResult[]) => void;
  setActions: (actions: Action[]) => void;
  setActionLogs: (logs: ActionLog[]) => void;
  setDailyFocus: (focus: DailyFocus | null) => void;
  selectObjective: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addObjective: (objective: Objective) => void;
  updateObjective: (id: number, data: Partial<Objective>) => void;
  removeObjective: (id: number) => void;

  addKeyResult: (kr: KeyResult) => void;
  updateKeyResult: (id: number, data: Partial<KeyResult>) => void;
  removeKeyResult: (id: number) => void;

  addAction: (action: Action) => void;
  updateAction: (id: number, data: Partial<Action>) => void;
  removeAction: (id: number) => void;

  addActionLog: (log: ActionLog) => void;
}

export const useOkrStore = create<OkrState>()(
  subscribeWithSelector((set) => ({
    objectives: [],
    keyResults: [],
    actions: [],
    actionLogs: [],
    dailyFocus: null,
    selectedObjectiveId: null,
    isLoading: false,
    error: null,

    setObjectives: (objectives) => set({ objectives }),
    setKeyResults: (keyResults) => set({ keyResults }),
    setActions: (actions) => set({ actions }),
    setActionLogs: (logs) => set({ actionLogs: logs }),
    setDailyFocus: (focus) => set({ dailyFocus: focus }),
    selectObjective: (id) => set({ selectedObjectiveId: id }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    addObjective: (objective) =>
      set((s) => ({ objectives: [...s.objectives, objective] })),
    updateObjective: (id, data) =>
      set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === id ? { ...o, ...data } : o
        ),
      })),
    removeObjective: (id) =>
      set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),

    addKeyResult: (kr) =>
      set((s) => ({ keyResults: [...s.keyResults, kr] })),
    updateKeyResult: (id, data) =>
      set((s) => ({
        keyResults: s.keyResults.map((k) =>
          k.id === id ? { ...k, ...data } : k
        ),
      })),
    removeKeyResult: (id) =>
      set((s) => ({ keyResults: s.keyResults.filter((k) => k.id !== id) })),

    addAction: (action) =>
      set((s) => ({ actions: [...s.actions, action] })),
    updateAction: (id, data) =>
      set((s) => ({
        actions: s.actions.map((a) =>
          a.id === id ? { ...a, ...data } : a
        ),
      })),
    removeAction: (id) =>
      set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),

    addActionLog: (log) =>
      set((s) => ({ actionLogs: [...s.actionLogs, log] })),
  }))
);
