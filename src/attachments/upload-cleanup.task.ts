import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import { APP_TIMEZONE } from '../common/time/time.constants';
import {
  attachmentIdFromFileName,
  removeFilesByUrl,
} from './attachment-file.util';
import { Attachment } from './attachment.entity';
import { UploadedFileCandidate } from './attachments.interface';
import {
  ATTACHMENT_ID_SELECT,
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
    const candidates = await this.findOldUploads();
    if (!candidates.length) return [];

    const referenced = await this.attachmentsRepository.find({
      where: { id: In(candidates.map((item) => item.id)) },
      select: ATTACHMENT_ID_SELECT,
    });
    const referencedIds = new Set(referenced.map((item) => item.id));
    const orphans = candidates
      .filter((item) => !referencedIds.has(item.id))
      .map((item) => item.url);

    await removeFilesByUrl(orphans);
    this.logger.log(`Removed ${orphans.length} orphan uploaded files`);
    return orphans;
  }

  private async findOldUploads(): Promise<UploadedFileCandidate[]> {
    const threshold = Date.now() - ORPHAN_FILE_MIN_AGE_MS;
    const folders = Object.values(UPLOAD_FOLDERS);
    const uploads = await Promise.all(
      folders.map(async (folder) => {
        const dir = join(PUBLIC_DIR, UPLOADS_URL_PREFIX, folder);
        const names = await readdir(dir).catch((): string[] => []);
        const old = await Promise.all(
          names
            .map((name) => ({ name, id: attachmentIdFromFileName(name) }))
            .filter((item): item is { name: string; id: string } => !!item.id)
            .map(async ({ name, id }) => {
              const info = await stat(join(dir, name)).catch(() => null);
              if (!info || info.mtimeMs >= threshold) return null;
              return { id, url: `${UPLOADS_URL_PREFIX}/${folder}/${name}` };
            }),
        );
        return old.filter(
          (item): item is UploadedFileCandidate => item !== null,
        );
      }),
    );
    return uploads.flat();
  }
}
