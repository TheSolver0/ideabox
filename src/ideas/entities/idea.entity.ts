import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';

export enum IdeaStatus {
  IDEA = 'idea',
  CONVERTED = 'converted'
}

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: IdeaStatus,
    default: IdeaStatus.IDEA
  })
  status: IdeaStatus;

  @OneToOne(() => Analysis, analysis => analysis.idea, { nullable: true })
  analysis: Analysis;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}