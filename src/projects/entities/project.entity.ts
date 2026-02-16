import { Idea } from 'src/ideas/entities/idea.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum ProjectStatus {
  EN_COURS = 'EN_COURS',
  REALISE = 'REALISE',
  COMMERCIALISE = 'COMMERCIALISE',
  ABANDONNE = 'ABANDONNE'
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: ProjectStatus,
    default: ProjectStatus.EN_COURS
  })
  status: ProjectStatus;

  @OneToMany(() => Idea, idea => idea.project)
  ideas: Idea[];


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}