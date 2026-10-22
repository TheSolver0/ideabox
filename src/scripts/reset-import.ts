import 'dotenv/config';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { AppDataSource, databasePath } from '../database/data-source';
import {
  HistoryAction,
  HistoryEntityType,
  HistoryEntry,
} from '../history/entities/history-entry.entity';
import { recordHistory } from '../history/history.utils';
import { Idea, IdeaPriority, IdeaStatus } from '../ideas/entities/idea.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';

const SOURCE = 'Liste manuscrite personnelle — import initial';
const entries = [
  [
    'Lepoto',
    'Application d’écriture et de lecture de livres en ligne.',
    IdeaStatus.RETENUE,
    '',
  ],
  [
    'Bluprof',
    'Application de suivi scolaire.',
    IdeaStatus.CAPTUREE,
    'Nom à confirmer à partir de la source manuscrite.',
  ],
  [
    'Mingo',
    'Application de gestion des commandes dans un restaurant.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Gestion des requêtes',
    'Application de gestion des requêtes.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Lumina',
    'Réseau universitaire et application de centralisation de l’information de l’université.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'MeetJob',
    'Plateforme d’annonces et d’obtention d’emplois, notamment les petits métiers.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Jc game',
    'Jeu de cryptographie.',
    IdeaStatus.CAPTUREE,
    'Nom à confirmer à partir de la source manuscrite.',
  ],
  [
    'Package factures et reçus',
    'Package pour générer des factures et des reçus.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Site de rencontre',
    'Site de rencontre.',
    IdeaStatus.ARCHIVEE,
    'Idée raturée sur la liste manuscrite ; nom original illisible. Conservée pour mémoire.',
  ],
  ['Duopay', 'Système de paiement en deux temps.', IdeaStatus.CAPTUREE, ''],
  [
    'Recherche immobilière',
    'Application de recherche de studios, appartements, maisons, bureaux et boutiques.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Afrisaveur',
    'Plateforme mettant en valeur les mets africains.',
    IdeaStatus.CAPTUREE,
    'Nom à confirmer à partir de la source manuscrite.',
  ],
  [
    'Gestion de stock et e-commerce',
    'Application de gestion de stock reliée à un site e-commerce, avec le cas d’une boutique d’équipements informatiques.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Gestion et réseau de pharmacies',
    'Application de gestion de pharmacie avec mise en réseau des pharmacies pour rechercher des médicaments.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'Votify',
    'Application de gestion du vote, de l’appel à candidatures jusqu’à la prise de fonction.',
    IdeaStatus.CAPTUREE,
    '',
  ],
  [
    'ERP construit avec l’IA',
    'ERP flexible construit avec une IA à partir d’un manuel de procédures fourni par l’employeur ou d’échanges avec celui-ci, pour obtenir un ERP sur mesure.',
    IdeaStatus.CAPTUREE,
    '',
  ],
] as const;

export async function resetAndImport(
  dataSource: DataSource,
): Promise<{ ideas: number; projects: number; archives: number }> {
  return dataSource.transaction(async (manager) => {
    const owner = await manager.getRepository('users').findOne({ where: {} });
    const ownerId = owner ? Number(owner.id) : null;
    await manager.getRepository(HistoryEntry).clear();
    await manager.getRepository(Analysis).clear();
    await manager.getRepository(Idea).clear();
    await manager.getRepository(Project).clear();

    const project = await manager.getRepository(Project).save(
      manager.getRepository(Project).create({
        ownerId,
        title: 'Lepoto',
        description: 'Application d’écriture et de lecture de livres en ligne.',
        status: ProjectStatus.LANCE_REALISE,
        nextAction: '',
        isCommercialized: false,
      }),
    );
    await recordHistory(manager, {
      ownerId,
      entityType: HistoryEntityType.PROJECT,
      entityId: project.id,
      projectId: project.id,
      action: HistoryAction.CREATED,
      changes: { import: { old: null, new: SOURCE } },
    });

    for (const [title, description, status, noteContent] of entries) {
      const idea = await manager.getRepository(Idea).save(
        manager.getRepository(Idea).create({
          ownerId,
          title,
          description,
          problem: '',
          targetAudience: '',
          status,
          priority: IdeaPriority.MOYENNE,
          focus: false,
          nextAction: '',
          source: SOURCE,
          statusBeforeArchive:
            status === IdeaStatus.ARCHIVEE ? IdeaStatus.CAPTUREE : null,
          projectId: title === 'Lepoto' ? project.id : null,
        }),
      );
      await recordHistory(manager, {
        ownerId,
        entityType: HistoryEntityType.IDEA,
        entityId: idea.id,
        ideaId: idea.id,
        projectId: idea.projectId,
        action: HistoryAction.CREATED,
        changes: { import: { old: null, new: SOURCE } },
      });
      if (noteContent) {
        const note = await manager.getRepository(Analysis).save(
          manager.getRepository(Analysis).create({
            ownerId,
            ideaId: idea.id,
            title:
              title === 'Site de rencontre'
                ? 'Contexte de la source'
                : 'Nom à confirmer',
            content: noteContent,
            archivedAt: null,
          }),
        );
        await recordHistory(manager, {
          ownerId,
          entityType: HistoryEntityType.NOTE,
          entityId: note.id,
          ideaId: idea.id,
          action: HistoryAction.CREATED,
          changes: {
            note: {
              old: null,
              new: { title: note.title, content: note.content },
            },
          },
        });
      }
    }
    return {
      ideas: await manager.getRepository(Idea).count(),
      projects: await manager.getRepository(Project).count(),
      archives: await manager
        .getRepository(Idea)
        .countBy({ status: IdeaStatus.ARCHIVEE }),
    };
  });
}

async function main() {
  if (process.env.CONFIRM_LOCAL_RESET !== 'RESET_IDEABOX_LOCAL') {
    throw new Error(
      'Définissez CONFIRM_LOCAL_RESET=RESET_IDEABOX_LOCAL pour confirmer',
    );
  }
  if (process.env.NODE_ENV === 'production')
    throw new Error('Réinitialisation refusée en production');
  const absoluteDatabase = resolve(databasePath);
  if (!existsSync(absoluteDatabase))
    throw new Error(`Base SQLite locale introuvable : ${absoluteDatabase}`);
  const backupDirectory = resolve(dirname(absoluteDatabase), 'backups');
  mkdirSync(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = resolve(
    backupDirectory,
    `${timestamp}${extname(absoluteDatabase) || '.sqlite'}.bak`,
  );
  copyFileSync(absoluteDatabase, backupPath);
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  const result = await resetAndImport(AppDataSource);
  await AppDataSource.destroy();
  console.log(
    `Import terminé : ${result.ideas} idées, ${result.projects} projet, ${result.archives} archive.`,
  );
  console.log(`Sauvegarde : ${backupPath}`);
}

if (require.main === module) {
  main().catch(async (error) => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    console.error(error instanceof Error ? error.message : 'Import impossible');
    process.exitCode = 1;
  });
}
