import { AccountNotificationTemplate } from './account-notification-template.enum';
import { NotificationTemplate } from './notification-template.enum';

export interface BookingNotificationJob {
  bookingId: number;
  template: NotificationTemplate;
  lang: string;
}

export interface AccountNotificationJob {
  userId: number;
  template: AccountNotificationTemplate;
  token: string;
  ttlMinutes: number;
  lang: string;
}
