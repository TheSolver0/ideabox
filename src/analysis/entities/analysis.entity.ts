import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Idea } from '../../ideas/entities/idea.entity';

@Entity('analysis')
export class Analysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  ideaId: number;

  @OneToOne(() => Idea, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ideaId' })
  idea: Idea;

  @Column('text', { nullable: true })
  problem: string;

  @Column('text', { nullable: true })
  solution: string;

  @Column('text', { nullable: true })
  targetAudience: string;

  @Column('text', { nullable: true })
  feasibility: string;

  @Column({ type: 'int', nullable: true, comment: 'Score de 1 à 10' })
  viabilityScore: number;

  @CreateDateColumn()
  createdAt: Date;
}