import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('is defined with repository and data source collaborators', () => {
    expect(new ProjectsService({} as never, {} as never)).toBeDefined();
  });
});
