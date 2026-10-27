import { isUUID } from 'class-validator';
import { unlink } from 'fs/promises';
import { join, parse } from 'path';
import { AttachableType } from './attachable-type.enum';
import {
  PUBLIC_DIR,
  UPLOAD_FOLDERS,
  UPLOADS_URL_PREFIX,
} from './attachments.constants';
import { AttachmentData } from './attachments.interface';

export function attachmentIdFromFileName(fileName: string): string | null {
  const { name } = parse(fileName);
  return isUUID(name) ? name : null;
}

export function toAttachmentData(
  file: Express.Multer.File,
  attachableType: AttachableType,
  attachableId: number,
): AttachmentData {
  return {
    id: parse(file.filename).name,
    attachableType,
    attachableId,
    url: `${UPLOADS_URL_PREFIX}/${UPLOAD_FOLDERS[attachableType]}/${file.filename}`,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
}

export async function removeUploadedFiles(
  files: Express.Multer.File[],
): Promise<void> {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
}

export async function removeFilesByUrl(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map((url) => unlink(join(PUBLIC_DIR, url)).catch(() => {})),
  );
}
