import { EntityManager } from 'typeorm';
import {
  HistoryAction,
  HistoryEntityType,
  HistoryEntry,
} from './entities/history-entry.entity';

export interface HistoryPayload {
  ownerId: number | null;
  entityType: HistoryEntityType;
  entityId: number;
  ideaId?: number | null;
  projectId?: number | null;
  action: HistoryAction;
  changes: Record<string, { old: unknown; new: unknown }>;
}

export async function recordHistory(
  manager: EntityManager,
  payload: HistoryPayload,
) {
  await manager.getRepository(HistoryEntry).save(
    manager.getRepository(HistoryEntry).create({
      ...payload,
      ideaId: payload.ideaId ?? null,
      projectId: payload.projectId ?? null,
    }),
  );
}

export function buildChanges<T extends object>(
  before: T,
  updates: Partial<T>,
): Record<string, { old: unknown; new: unknown }> {
  const previous = before as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(updates)
      .filter(([key, value]) => value !== undefined && previous[key] !== value)
      .map(([key, value]) => [key, { old: previous[key], new: value }]),
  );
}
