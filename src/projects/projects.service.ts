import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Idea, IdeaStatus } from '../ideas/entities/idea.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Récupérer l'idée
    const idea = await this.ideasRepository.findOneBy({ id: createProjectDto.ideaId });
    if (!idea) {
      throw new NotFoundException(`Idée #${createProjectDto.ideaId} non trouvée`);
    }

    // Créer le projet
    const project = this.projectsRepository.create({
      ideaId: idea.id,
      title: idea.title,
      description: idea.description,
    });
    
    const savedProject = await this.projectsRepository.save(project);

    // Marquer l'idée comme convertie
    await this.ideasRepository.update(idea.id, { status: IdeaStatus.CONVERTED });

    return savedProject;
  }

  findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOneBy({ id });
    if (!project) {
      throw new NotFoundException(`Projet #${id} non trouvé`);
    }
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);
    await this.projectsRepository.update(id, updateProjectDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.projectsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Projet #${id} non trouvé`);
    }
  }
}