import { join } from 'path';
import { AttachableType } from './attachable-type.enum';

export const PUBLIC_DIR = join(process.cwd(), 'public');
export const UPLOADS_URL_PREFIX = '/uploads';

export const UPLOAD_FOLDERS: Record<AttachableType, string> = {
  [AttachableType.USER_AVATAR]: 'avatars',
  [AttachableType.TOUR_IMAGE]: 'tours',
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_TOUR_IMAGES_PER_REQUEST = 10;

export const ATTACHMENT_SELECT = {
  id: true,
  url: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  createdAt: true,
} as const;

export const ATTACHMENT_FILE_SELECT = { id: true, url: true } as const;
