import './load-env';
import { DataSource } from 'typeorm';
import dataSource from '../../src/database/data-source';

async function ensureDatabaseExists(database: string): Promise<void> {
  const server = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });
  await server.initialize();
  const rows: unknown[] = await server.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [database],
  );
  if (!rows.length) {
    await server.query(`CREATE DATABASE "${database}"`);
  }
  await server.destroy();
}

export default async function globalSetup(): Promise<void> {
  await ensureDatabaseExists(process.env.DB_NAME!);
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
