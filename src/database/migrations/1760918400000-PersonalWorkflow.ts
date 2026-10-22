import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalWorkflow1760918400000 implements MigrationInterface {
  name = 'PersonalWorkflow1760918400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "email" varchar NOT NULL UNIQUE,
      "passwordHash" varchar NOT NULL,
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
      "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
    )`);
    const hasProjects = await queryRunner.hasTable('projects');
    const hasIdeas = await queryRunner.hasTable('ideas');
    const hasAnalysis = await queryRunner.hasTable('analysis');
    if (hasAnalysis)
      await queryRunner.renameTable('analysis', 'analysis_legacy');
    if (hasIdeas) await queryRunner.renameTable('ideas', 'ideas_legacy');
    if (hasProjects)
      await queryRunner.renameTable('projects', 'projects_legacy');

    await queryRunner.query(`CREATE TABLE "projects" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ownerId" integer, "title" varchar NOT NULL,
      "description" text NOT NULL DEFAULT '',
      "status" varchar NOT NULL DEFAULT 'PREVU' CHECK("status" IN ('PREVU','EN_COURS','LANCE_REALISE','EN_PAUSE','ABANDONNE')),
      "nextAction" text NOT NULL DEFAULT '', "isCommercialized" boolean NOT NULL DEFAULT 0,
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "ideas" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ownerId" integer, "title" varchar NOT NULL,
      "description" text NOT NULL DEFAULT '', "problem" text NOT NULL DEFAULT '', "targetAudience" text NOT NULL DEFAULT '',
      "status" varchar NOT NULL DEFAULT 'CAPTUREE' CHECK("status" IN ('CAPTUREE','A_CREUSER','A_TESTER','RETENUE','ARCHIVEE')),
      "priority" varchar NOT NULL DEFAULT 'MOYENNE' CHECK("priority" IN ('BASSE','MOYENNE','HAUTE')),
      "focus" boolean NOT NULL DEFAULT 0, "nextAction" text NOT NULL DEFAULT '', "source" text NOT NULL DEFAULT '',
      "statusBeforeArchive" varchar, "projectId" integer,
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE,
      FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL
    )`);
    await queryRunner.query(`CREATE TABLE "analysis" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ownerId" integer, "ideaId" integer NOT NULL,
      "title" varchar NOT NULL, "content" text NOT NULL, "archivedAt" datetime,
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE,
      FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "history_entries" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ownerId" integer, "entityType" varchar NOT NULL,
      "entityId" integer NOT NULL, "ideaId" integer, "projectId" integer, "action" varchar NOT NULL,
      "changes" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      'CREATE INDEX "IDX_ideas_owner_status" ON "ideas" ("ownerId", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_ideas_owner_focus" ON "ideas" ("ownerId", "focus")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_history_owner_idea" ON "history_entries" ("ownerId", "ideaId")',
    );

    if (hasProjects) {
      await queryRunner.query(`INSERT INTO "projects" (id,title,description,status,createdAt,updatedAt)
        SELECT id,title,description,CASE status WHEN 'REALISE' THEN 'LANCE_REALISE' WHEN 'COMMERCIALISE' THEN 'LANCE_REALISE' ELSE status END,createdAt,updatedAt FROM "projects_legacy"`);
    }
    if (hasIdeas) {
      await queryRunner.query(`INSERT INTO "ideas" (id,title,description,status,projectId,createdAt,updatedAt)
        SELECT id,title,description,CASE status WHEN 'converted' THEN 'RETENUE' ELSE 'CAPTUREE' END,projectId,createdAt,updatedAt FROM "ideas_legacy"`);
    }
    if (hasAnalysis) {
      await queryRunner.query(`INSERT INTO "analysis" (id,ideaId,title,content,createdAt,updatedAt)
        SELECT id,ideaId,axisName,content,createdAt,createdAt FROM "analysis_legacy"`);
    }
    if (hasAnalysis) await queryRunner.dropTable('analysis_legacy');
    if (hasIdeas) await queryRunner.dropTable('ideas_legacy');
    if (hasProjects) await queryRunner.dropTable('projects_legacy');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "history_entries"');
    await queryRunner.query('DROP TABLE IF EXISTS "analysis"');
    await queryRunner.query('DROP TABLE IF EXISTS "ideas"');
    await queryRunner.query('DROP TABLE IF EXISTS "projects"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
