import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RemoveUploadsOnErrorInterceptor } from './attachments/remove-uploads-on-error.interceptor';
import { validationExceptionFactory } from './common/validation-exception-factory';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new RemoveUploadsOnErrorInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
