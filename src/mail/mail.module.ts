import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createTransport({
          host: configService.getOrThrow<string>('MAIL_HOST'),
          port: configService.getOrThrow<number>('MAIL_PORT'),
        }),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
