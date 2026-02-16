import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from './entities/analysis.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { Idea } from '../ideas/entities/idea.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Idea)
    private ideasRepository: Repository<Idea>,
  ) {}

  async create(createAnalysisDto: CreateAnalysisDto): Promise<Analysis> {
    // Vérifier que l'idée existe
    const idea = await this.ideasRepository.findOneBy({ id: createAnalysisDto.ideaId });
    if (!idea) {
      throw new NotFoundException(`Idée #${createAnalysisDto.ideaId} non trouvée`);
    }

    const analysis = this.analysisRepository.create(createAnalysisDto);
    return this.analysisRepository.save(analysis);
  }

  async findAllByIdeaId(ideaId: number): Promise<Analysis[]> {
     return this.analysisRepository.find({
      where: { ideaId },
      order: { createdAt: 'ASC' }
    });
  }

  async findByIdeaId(ideaId: number): Promise<Analysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { ideaId },
      order: { createdAt: 'DESC' }
    }); 
    if (!analysis) {
      throw new NotFoundException(`Analyse pour l'idée #${ideaId} non trouvée`);
    }
    return analysis;
  }


   async update(id: number, updateAnalysisDto: UpdateAnalysisDto): Promise<Analysis> {
    const analysis = await this.analysisRepository.findOneBy({ id });
    if (!analysis) {
      throw new NotFoundException(`Analyse #${id} non trouvée`);
    }
    
    Object.assign(analysis, updateAnalysisDto);
    return this.analysisRepository.save(analysis);
  }

  async remove(id: number): Promise<void> {
    const result = await this.analysisRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Analyse #${id} non trouvée`);
    }
  }
}