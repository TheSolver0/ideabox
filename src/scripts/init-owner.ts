import 'dotenv/config';
import { hash } from 'bcryptjs';
import { IsNull } from 'typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { User } from '../auth/entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { HistoryEntry } from '../history/entities/history-entry.entity';
import { Idea } from '../ideas/entities/idea.entity';
import { Project } from '../projects/entities/project.entity';

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error(
      'OWNER_EMAIL et OWNER_PASSWORD (12 caractères minimum) sont obligatoires',
    );
  }
  await AppDataSource.initialize();
  await AppDataSource.transaction(async (manager) => {
    const users = manager.getRepository(User);
    const existing = await users.find();
    if (existing.length > 1 || (existing[0] && existing[0].email !== email)) {
      throw new Error('Un autre compte propriétaire existe déjà');
    }
    const passwordHash = await hash(
      password,
      Number(process.env.PASSWORD_HASH_ROUNDS || 12),
    );
    const owner = existing[0]
      ? await users.save({ ...existing[0], passwordHash })
      : await users.save(users.create({ email, passwordHash }));
    await manager
      .getRepository(Project)
      .update({ ownerId: IsNull() }, { ownerId: owner.id });
    await manager
      .getRepository(Idea)
      .update({ ownerId: IsNull() }, { ownerId: owner.id });
    await manager
      .getRepository(Analysis)
      .update({ ownerId: IsNull() }, { ownerId: owner.id });
    await manager
      .getRepository(HistoryEntry)
      .update({ ownerId: IsNull() }, { ownerId: owner.id });
  });
  await AppDataSource.destroy();
  console.log('Compte propriétaire initialisé.');
}

main().catch(async (error) => {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  console.error(
    error instanceof Error ? error.message : 'Initialisation impossible',
  );
  process.exitCode = 1;
});
