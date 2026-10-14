import { DataSource } from 'typeorm';

export async function truncateAllTables(dataSource: DataSource): Promise<void> {
  const tables = dataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(', ');
  await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}
