import { Mailbox } from './mail.interface';

const MAILBOX_PATTERN = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/;

export function parseMailbox(value: string): Mailbox {
  const match = MAILBOX_PATTERN.exec(value);
  if (!match) return { email: value.trim() };
  const [, name, email] = match;
  return name ? { name, email: email.trim() } : { email: email.trim() };
}
