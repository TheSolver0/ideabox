import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum HistoryEntityType {
  IDEA = 'IDEA',
  PROJECT = 'PROJECT',
  NOTE = 'NOTE',
}

export enum HistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  ARCHIVED = 'ARCHIVED',
  RESTORED = 'RESTORED',
  ASSOCIATED = 'ASSOCIATED',
  DISSOCIATED = 'DISSOCIATED',
}

@Entity('history_entries')
export class HistoryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @Column({ type: 'varchar' })
  entityType: HistoryEntityType;

  @Column()
  entityId: number;

  @Column({ type: 'int', nullable: true })
  ideaId: number | null;

  @Column({ type: 'int', nullable: true })
  projectId: number | null;

  @Column({ type: 'varchar' })
  action: HistoryAction;

  @Column('simple-json')
  changes: Record<string, { old: unknown; new: unknown }>;

  @CreateDateColumn()
  createdAt: Date;
}
