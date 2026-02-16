import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Idea } from '../ideas/entities/idea.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Créer le projet
    const project = this.projectsRepository.create({
      title: createProjectDto.title,
      description: createProjectDto.description,
    });
    
    const savedProject = await this.projectsRepository.save(project);

    // Associer les idées si fournies
    if (createProjectDto.ideaIds && createProjectDto.ideaIds.length > 0) {
      await this.ideasRepository.update(
        { id: In(createProjectDto.ideaIds) },
        { projectId: savedProject.id }
      );
    }

    return this.findOne(savedProject.id);
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ['ideas'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['ideas']
    });
    
    if (!project) {
      throw new NotFoundException(`Projet #${id} non trouvé`);
    }
    
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    await this.projectsRepository.save(project);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Libérer les idées avant de supprimer
    await this.ideasRepository.update(
      { projectId: id },
      { projectId: null }
    );
    
    const result = await this.projectsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Projet #${id} non trouvé`);
    }
  }
}