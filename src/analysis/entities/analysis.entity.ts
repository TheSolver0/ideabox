import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Idea } from '../../ideas/entities/idea.entity';

@Entity('analysis')
export class Analysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  ideaId: number;

  @ManyToOne(() => Idea,idea => idea.analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ideaId' })
  idea: Idea;

  @Column()
  axisName: string; // "Problème", "Solution", "Marché", etc.

  @Column('text')
  content: string;

  @Column({ type: 'int', nullable: true })
  score: number;

  @CreateDateColumn()
  createdAt: Date;
}