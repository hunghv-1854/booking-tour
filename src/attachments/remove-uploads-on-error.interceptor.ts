import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { removeUploadedFiles } from './attachment-file.util';

@Injectable()
export class RemoveUploadsOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    return next
      .handle()
      .pipe(
        catchError((error: unknown) =>
          from(removeUploadedFiles(collectFiles(request))).pipe(
            switchMap(() => throwError(() => error)),
          ),
        ),
      );
  }
}

function collectFiles(request: Request): Express.Multer.File[] {
  const { file, files } = request;
  if (file) return [file];
  if (Array.isArray(files)) return files;
  return files ? Object.values(files).flat() : [];
}
