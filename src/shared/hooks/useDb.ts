import { useEffect } from 'react';
import { db } from '../db';
import { useOkrStore } from '../store';

/**
 * Loads all data from IndexedDB into the Zustand store on mount.
 */
export function useDb() {
  const {
    setObjectives,
    setKeyResults,
    setActions,
    setActionLogs,
    setLoading,
    setError,
  } = useOkrStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [objectives, keyResults, actions, actionLogs] = await Promise.all([
          db.objectives.toArray(),
          db.keyResults.toArray(),
          db.actions.toArray(),
          db.actionLogs.toArray(),
        ]);
        setObjectives(objectives);
        setKeyResults(keyResults);
        setActions(actions);
        setActionLogs(actionLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'DB load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setObjectives, setKeyResults, setActions, setActionLogs, setLoading, setError]);
}
