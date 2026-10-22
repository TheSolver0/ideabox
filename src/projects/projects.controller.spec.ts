import { Test } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  it('is defined with its service', async () => {
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: {} }],
    }).compile();
    expect(module.get(ProjectsController)).toBeDefined();
  });
});
