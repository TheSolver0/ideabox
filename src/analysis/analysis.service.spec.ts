import { AnalysisService } from './analysis.service';

describe('AnalysisService', () => {
  it('is defined with repository and data source collaborators', () => {
    expect(new AnalysisService({} as never, {} as never)).toBeDefined();
  });
});
