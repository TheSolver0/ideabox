import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Idea } from '../../ideas/entities/idea.entity';

export enum ProjectStatus {
  PREVU = 'PREVU',
  EN_COURS = 'EN_COURS',
  LANCE_REALISE = 'LANCE_REALISE',
  EN_PAUSE = 'EN_PAUSE',
  ABANDONNE = 'ABANDONNE',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @Column()
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column({ type: 'varchar', default: ProjectStatus.PREVU })
  status: ProjectStatus;

  @Column('text', { default: '' })
  nextAction: string;

  @Column({ default: false })
  isCommercialized: boolean;

  @OneToMany(() => Idea, (idea) => idea.project)
  ideas: Idea[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
