import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { removeFilesByUrl } from './attachment-file.util';
import { Attachment } from './attachment.entity';
import {
  ATTACHMENT_URL_SELECT,
  ORPHAN_FILE_MIN_AGE_MS,
  PUBLIC_DIR,
  UPLOAD_CLEANUP_CRON,
  UPLOAD_FOLDERS,
  UPLOADS_URL_PREFIX,
} from './attachments.constants';

@Injectable()
export class UploadCleanupTask {
  private readonly logger = new Logger(UploadCleanupTask.name);

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
  ) {}

  @Cron(UPLOAD_CLEANUP_CRON, { timeZone: APP_TIMEZONE })
  async removeOrphanFiles(): Promise<string[]> {
    const candidates = await this.findOldUploadUrls();
    if (!candidates.length) return [];

    const referenced = await this.attachmentsRepository.find({
      where: { url: In(candidates) },
      select: ATTACHMENT_URL_SELECT,
    });
    const referencedUrls = new Set(referenced.map((item) => item.url));
    const orphans = candidates.filter((url) => !referencedUrls.has(url));

    await removeFilesByUrl(orphans);
    this.logger.log(`Removed ${orphans.length} orphan uploaded files`);
    return orphans;
  }

  private async findOldUploadUrls(): Promise<string[]> {
    const threshold = Date.now() - ORPHAN_FILE_MIN_AGE_MS;
    const folders = Object.values(UPLOAD_FOLDERS);
    const urls = await Promise.all(
      folders.map(async (folder) => {
        const dir = join(PUBLIC_DIR, UPLOADS_URL_PREFIX, folder);
        const names = await readdir(dir).catch(() => []);
        const old = await Promise.all(
          names
            .filter((name) => !name.startsWith('.'))
            .map(async (name) => {
              const info = await stat(join(dir, name)).catch(() => null);
              return info && info.mtimeMs < threshold ? name : null;
            }),
        );
        return old
          .filter((name): name is string => name !== null)
          .map((name) => `${UPLOADS_URL_PREFIX}/${folder}/${name}`);
      }),
    );
    return urls.flat();
  }
}
