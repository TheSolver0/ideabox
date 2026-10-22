/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { existsSync, rmSync } from 'node:fs';
import request, { SuperAgentTest } from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/entities/user.entity';
import { resetAndImport } from '../src/scripts/reset-import';

const testDatabase = 'db/ideabox.e2e.sqlite';
process.env.IDEABOX_DB_PATH = testDatabase;
process.env.AUTH_JWT_SECRET = 'test-only-secret-that-is-long-enough-for-jwt';
process.env.AUTH_TOKEN_TTL_SECONDS = '300';
jest.setTimeout(60_000);

describe('IdeaBox personnel (e2e)', () => {
  let app;
  let dataSource: DataSource;
  let agent: SuperAgentTest;
  let ideaId: number;

  beforeAll(async () => {
    if (existsSync(testDatabase)) rmSync(testDatabase);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await dataSource.getRepository(User).save({
      email: 'owner@example.com',
      passwordHash: await hash('a-secure-test-password', 4),
    });
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    if (existsSync(testDatabase)) rmSync(testDatabase);
  });

  it('refuse les données sans authentification et ouvre une session propriétaire', async () => {
    await request(app.getHttpServer()).get('/ideas').expect(401);
    await agent
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'a-secure-test-password' })
      .expect(201);
    await agent.get('/ideas').expect(200);
  });

  it('crée une idée avec son seul titre', async () => {
    const response = await agent
      .post('/ideas')
      .send({ title: 'Idée minimale' })
      .expect(201);
    expect(response.body.description).toBe('');
    expect(response.body.status).toBe('CAPTUREE');
    ideaId = response.body.id;
  });

  it('impose la limite serveur de trois idées en Focus', async () => {
    for (const title of ['Focus un', 'Focus deux', 'Focus trois']) {
      await agent.post('/ideas').send({ title, focus: true }).expect(201);
    }
    await agent
      .post('/ideas')
      .send({ title: 'Focus quatre', focus: true })
      .expect(409);
  });

  it('archive, retire du Focus et restaure une idée', async () => {
    const focusIdea = (await agent.get('/ideas?focus=true')).body[0];
    const archived = await agent
      .post(`/ideas/${focusIdea.id}/archive`)
      .expect(201);
    expect(archived.body.status).toBe('ARCHIVEE');
    expect(archived.body.focus).toBe(false);
    const restored = await agent
      .post(`/ideas/${focusIdea.id}/restore`)
      .expect(201);
    expect(restored.body.status).toBe('CAPTUREE');
  });

  it('historise les anciennes et nouvelles valeurs', async () => {
    await agent
      .patch(`/ideas/${ideaId}`)
      .send({ title: 'Idée renommée' })
      .expect(200);
    const history = await agent.get(`/ideas/${ideaId}/history`).expect(200);
    const update = history.body.find(
      (entry) => entry.action === 'UPDATED' && entry.changes.title,
    );
    expect(update.changes.title).toEqual({
      old: 'Idée minimale',
      new: 'Idée renommée',
    });
  });

  it('crée réellement un projet depuis une idée et conserve l’association', async () => {
    const project = await agent
      .post(`/ideas/${ideaId}/project`)
      .send({})
      .expect(201);
    const idea = await agent.get(`/ideas/${ideaId}`).expect(200);
    expect(idea.body.project.id).toBe(project.body.id);
    const projectDetail = await agent
      .get(`/projects/${project.body.id}`)
      .expect(200);
    expect(projectDetail.body.ideas.map((entry) => entry.id)).toContain(ideaId);
    await agent
      .patch(`/ideas/${ideaId}`)
      .send({ projectId: 999999 })
      .expect(404);
  });

  it('importe 16 idées sans doublons et associe le projet Lepoto', async () => {
    expect(await dataSource.getRepository(User).count()).toBe(1);
    await resetAndImport(dataSource);
    const result = await resetAndImport(dataSource);
    expect(result).toEqual({ ideas: 16, projects: 1, archives: 1 });
    expect(await dataSource.getRepository(User).count()).toBe(1);
    const lepoto = await dataSource
      .getRepository('ideas')
      .findOne({ where: { title: 'Lepoto' }, relations: ['project'] });
    expect(lepoto.project.title).toBe('Lepoto');
    expect(lepoto.project.status).toBe('LANCE_REALISE');
  });
});
