import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Idea, IdeaStatus } from './entities/idea.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
  ) {}

  create(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    const idea = this.ideasRepository.create(createIdeaDto);
    return this.ideasRepository.save(idea);
  }

  findAll(): Promise<Idea[]> {
    return this.ideasRepository.find({
      relations: ['analysis'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Idea> {
    const idea = await this.ideasRepository.findOne({
      where: { id },
      relations: ['analysis']
    });
    
    if (!idea) {
      throw new NotFoundException(`Idée #${id} non trouvée`);
    }
    
    return idea;
  }

  async update(id: number, updateIdeaDto: UpdateIdeaDto): Promise<Idea> {
    await this.findOne(id); // Vérifie l'existence
    await this.ideasRepository.update(id, updateIdeaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ideasRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Idée #${id} non trouvée`);
    }
  }

  async convertToProject(id: number): Promise<Idea> {
    await this.findOne(id);
    await this.ideasRepository.update(id, { status: IdeaStatus.CONVERTED });
    return this.findOne(id);
  }
}