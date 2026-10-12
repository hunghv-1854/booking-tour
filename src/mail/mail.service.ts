import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail.constants';
import { MailMessage } from './mail.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORTER) private readonly transporter: Transporter,
    private readonly configService: ConfigService,
  ) {}

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      ...message,
    });
  }
}
