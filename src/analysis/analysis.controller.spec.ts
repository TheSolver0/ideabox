import { Test } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

describe('AnalysisController', () => {
  it('is defined with its service', async () => {
    const module = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: {} }],
    }).compile();
    expect(module.get(AnalysisController)).toBeDefined();
  });
});
