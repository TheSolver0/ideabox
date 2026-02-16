import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Project } from 'src/projects/entities/project.entity';

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

  @OneToMany(() => Analysis, analysis => analysis.idea, { cascade: true })
  analysis: Analysis[];

  @Column({ nullable: true })
  projectId: number | null;

  @ManyToOne(() => Project, project => project.ideas, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}