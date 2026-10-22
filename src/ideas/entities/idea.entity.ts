import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Project } from '../../projects/entities/project.entity';

export enum IdeaStatus {
  CAPTUREE = 'CAPTUREE',
  A_CREUSER = 'A_CREUSER',
  A_TESTER = 'A_TESTER',
  RETENUE = 'RETENUE',
  ARCHIVEE = 'ARCHIVEE',
}

export enum IdeaPriority {
  BASSE = 'BASSE',
  MOYENNE = 'MOYENNE',
  HAUTE = 'HAUTE',
}

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @Column()
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column('text', { default: '' })
  problem: string;

  @Column('text', { default: '' })
  targetAudience: string;

  @Column({ type: 'varchar', default: IdeaStatus.CAPTUREE })
  status: IdeaStatus;

  @Column({ type: 'varchar', default: IdeaPriority.MOYENNE })
  priority: IdeaPriority;

  @Column({ default: false })
  focus: boolean;

  @Column('text', { default: '' })
  nextAction: string;

  @Column('text', { default: '' })
  source: string;

  @Column({ type: 'varchar', nullable: true })
  statusBeforeArchive: IdeaStatus | null;

  @OneToMany(() => Analysis, (analysis) => analysis.idea, { cascade: true })
  analysis: Analysis[];

  @Column({ type: 'int', nullable: true })
  projectId: number | null;

  @ManyToOne(() => Project, (project) => project.ideas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
