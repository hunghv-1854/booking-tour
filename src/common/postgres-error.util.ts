import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
} from './postgres-error.constants';

function hasPostgresCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return hasPostgresCode(error, FOREIGN_KEY_VIOLATION);
}

export function isUniqueViolation(error: unknown): boolean {
  return hasPostgresCode(error, UNIQUE_VIOLATION);
}
