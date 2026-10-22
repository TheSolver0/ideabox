import 'dotenv/config';
import { DataSource } from 'typeorm';

export const databasePath = process.env.IDEABOX_DB_PATH || 'db/db.sqlite';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: databasePath,
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
  migrationsRun: false,
});
