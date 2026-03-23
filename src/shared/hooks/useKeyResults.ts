import { useCallback } from 'react';
import { db, type KeyResult } from '../db';
import { useOkrStore } from '../store';
import { KeyResultSchema, type KeyResultInput } from '../db/validators';

export function useKeyResults() {
  const { keyResults, addKeyResult, updateKeyResult, removeKeyResult } = useOkrStore();

  const create = useCallback(
    async (input: KeyResultInput): Promise<KeyResult> => {
      const parsed = KeyResultSchema.parse(input);
      const now = new Date();
      const data: Omit<KeyResult, 'id'> = {
        ...parsed,
        lastActivityAt: now,
      };
      const id = await db.keyResults.add(data as KeyResult);
      const created: KeyResult = { ...data, id: id as number };
      addKeyResult(created);
      return created;
    },
    [addKeyResult]
  );

  const update = useCallback(
    async (id: number, data: Partial<KeyResult>) => {
      const patch = { ...data, lastActivityAt: new Date() };
      await db.keyResults.update(id, patch);
      updateKeyResult(id, patch);
    },
    [updateKeyResult]
  );

  const remove = useCallback(
    async (id: number) => {
      await db.keyResults.delete(id);
      removeKeyResult(id);
    },
    [removeKeyResult]
  );

  return { keyResults, create, update, remove };
}
