import { AccountNotificationTemplate } from './account-notification-template.enum';
import { BookingStatus } from '../bookings/booking-status.enum';

export interface BookingStatusChangedJob {
  bookingId: number;
  status: BookingStatus;
  lang: string;
}

export interface AccountNotificationJob {
  userId: number;
  template: AccountNotificationTemplate;
  token: string;
  ttlMinutes: number;
  lang: string;
}
