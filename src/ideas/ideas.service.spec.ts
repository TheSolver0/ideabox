import { IdeasService } from './ideas.service';

describe('IdeasService', () => {
  it('is defined with repository and data source collaborators', () => {
    expect(new IdeasService({} as never, {} as never)).toBeDefined();
  });
});
