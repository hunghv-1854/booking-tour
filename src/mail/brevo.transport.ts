import type { Transport } from 'nodemailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import { BREVO_SEND_EMAIL_URL } from './mail.constants';
import { BrevoSentInfo } from './mail.interface';
import { parseMailbox } from './mailbox.util';

export class BrevoTransport implements Transport<BrevoSentInfo> {
  readonly name = 'brevo';
  readonly version = '1.0.0';

  constructor(private readonly apiKey: string) {}

  send(
    mail: MailMessage<BrevoSentInfo>,
    callback: (error: Error | null, info: BrevoSentInfo) => void,
  ): void {
    this.post(mail)
      .then((info) => callback(null, info))
      .catch((error: Error) => callback(error, { messageId: '' }));
  }

  private async post(mail: MailMessage<BrevoSentInfo>): Promise<BrevoSentInfo> {
    const { from, to, subject, text } = mail.data;
    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: parseMailbox(requireString(from, 'from')),
        to: [parseMailbox(requireString(to, 'to'))],
        subject,
        textContent: requireString(text, 'text'),
      }),
    });
    if (!response.ok) {
      throw new Error(`Brevo API ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as BrevoSentInfo;
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`BrevoTransport only supports a plain string "${field}"`);
  }
  return value;
}
