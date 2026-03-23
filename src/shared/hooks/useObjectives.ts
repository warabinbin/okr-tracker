import { useCallback } from 'react';
import { db, type Objective } from '../db';
import { useOkrStore } from '../store';
import { ObjectiveSchema, type ObjectiveInput } from '../db/validators';

export function useObjectives() {
  const { objectives, addObjective, updateObjective, removeObjective } = useOkrStore();

  const create = useCallback(async (input: ObjectiveInput) => {
    const parsed = ObjectiveSchema.parse(input);
    const now = new Date();
    const id = await db.objectives.add({
      ...parsed,
      createdAt: now,
      updatedAt: now,
    });
    const created: Objective = { ...parsed, id: id as number, createdAt: now, updatedAt: now };
    addObjective(created);
    return created;
  }, [addObjective]);

  const update = useCallback(async (id: number, data: Partial<ObjectiveInput>) => {
    const updatedAt = new Date();
    await db.objectives.update(id, { ...data, updatedAt });
    updateObjective(id, { ...data, updatedAt });
  }, [updateObjective]);

  const remove = useCallback(async (id: number) => {
    await db.objectives.delete(id);
    removeObjective(id);
  }, [removeObjective]);

  return { objectives, create, update, remove };
}
