import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { I18nContext } from 'nestjs-i18n';
import { extname, join } from 'path';
import { fieldError } from '../common/validation/field-error.util';
import { AttachableType } from './attachable-type.enum';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  PUBLIC_DIR,
  UPLOAD_FOLDERS,
  UPLOADS_URL_PREFIX,
} from './attachments.constants';

export function imageUploadOptions(type: AttachableType): MulterOptions {
  return {
    storage: diskStorage({
      destination: join(PUBLIC_DIR, UPLOADS_URL_PREFIX, UPLOAD_FOLDERS[type]),
      filename: (_req, file, callback) =>
        callback(null, `${randomUUID()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
        return callback(null, true);
      }
      const message =
        I18nContext.current()?.t('attachments.invalid_image_type') ??
        'invalid image type';
      callback(fieldError(file.fieldname, message), false);
    },
  };
}
