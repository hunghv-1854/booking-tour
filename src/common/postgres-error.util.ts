import { FOREIGN_KEY_VIOLATION } from './postgres-error.constants';

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === FOREIGN_KEY_VIOLATION
  );
}
