import { APP_TIMEZONE } from './time.constants';

export function todayInAppTimezone(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(
    new Date(),
  );
}
