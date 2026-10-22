import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Idea } from '../../ideas/entities/idea.entity';

@Entity('analysis')
export class Analysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @Column()
  ideaId: number;

  @ManyToOne(() => Idea, (idea) => idea.analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ideaId' })
  idea: Idea;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'datetime', nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
