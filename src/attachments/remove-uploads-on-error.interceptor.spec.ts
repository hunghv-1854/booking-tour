import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import * as fileUtil from './attachment-file.util';
import { RemoveUploadsOnErrorInterceptor } from './remove-uploads-on-error.interceptor';

describe('RemoveUploadsOnErrorInterceptor', () => {
  const interceptor = new RemoveUploadsOnErrorInterceptor();
  const removeSpy = jest
    .spyOn(fileUtil, 'removeUploadedFiles')
    .mockResolvedValue();

  const contextWith = (request: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as ExecutionContext;
  const handlerOf = (result: ReturnType<CallHandler['handle']>) =>
    ({ handle: () => result }) as CallHandler;

  beforeEach(() => removeSpy.mockClear());

  it('keeps uploaded files when the request succeeds', async () => {
    const file = { path: '/tmp/a.png' } as Express.Multer.File;

    await lastValueFrom(
      interceptor.intercept(contextWith({ file }), handlerOf(of('ok'))),
    );

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('removes a single uploaded file and rethrows the original error', async () => {
    const file = { path: '/tmp/a.png' } as Express.Multer.File;
    const error = new Error('validation failed');

    await expect(
      lastValueFrom(
        interceptor.intercept(
          contextWith({ file }),
          handlerOf(throwError(() => error)),
        ),
      ),
    ).rejects.toBe(error);
    expect(removeSpy).toHaveBeenCalledWith([file]);
  });

  it('removes every file of a multi-file upload', async () => {
    const files = [{ path: '/tmp/a.png' }, { path: '/tmp/b.png' }];

    await expect(
      lastValueFrom(
        interceptor.intercept(
          contextWith({ files }),
          handlerOf(throwError(() => new Error('boom'))),
        ),
      ),
    ).rejects.toThrow('boom');
    expect(removeSpy).toHaveBeenCalledWith(files);
  });
});
