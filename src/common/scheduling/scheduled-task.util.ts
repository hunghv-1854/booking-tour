import { Logger } from '@nestjs/common';

export async function runScheduledTask<T>(
  logger: Logger,
  taskName: string,
  task: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await task();
  } catch (error) {
    logger.error(
      `${taskName} failed, will retry on next run`,
      error instanceof Error ? error.stack : String(error),
    );
    return [];
  }
}
