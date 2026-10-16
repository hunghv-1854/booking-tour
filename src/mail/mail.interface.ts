export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailbox {
  name?: string;
  email: string;
}

export interface BrevoSentInfo {
  messageId: string;
}
