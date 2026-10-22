import { Test } from '@nestjs/testing';
import { HistoryService } from '../history/history.service';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

describe('IdeasController', () => {
  it('is defined with its collaborators', async () => {
    const module = await Test.createTestingModule({
      controllers: [IdeasController],
      providers: [
        { provide: IdeasService, useValue: {} },
        { provide: HistoryService, useValue: {} },
      ],
    }).compile();
    expect(module.get(IdeasController)).toBeDefined();
  });
});
