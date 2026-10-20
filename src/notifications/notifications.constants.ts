import { BookingStatus } from '../bookings/booking-status.enum';
import { NotificationTemplate } from './notification-template.enum';

export const BOOKING_NOTIFICATION_QUEUE = 'booking-notifications';
export const BOOKING_NOTIFICATION_JOB = 'booking-notification';

export const BOOKING_NOTIFICATION_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: 100,
};

export const DEFAULT_MAIL_LANG = 'vi';

export const BOOKING_NOTIFICATION_SELECT = {
  id: true,
  startDate: true,
  status: true,
  rejectReason: true,
  user: { id: true, email: true, fullName: true },
  tour: { id: true, name: true },
} as const;

export const ACCOUNT_NOTIFICATION_QUEUE = 'account-notifications';
export const ACCOUNT_NOTIFICATION_JOB = 'account-notification';

export const ACCOUNT_NOTIFICATION_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: true,
};

export const ACCOUNT_NOTIFICATION_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
} as const;

export const SCHEDULED_NOTIFICATION_RETENTION_SECONDS = 7 * 24 * 60 * 60;

export const STATUS_NOTIFICATION_TEMPLATES: Partial<
  Record<BookingStatus, NotificationTemplate>
> = {
  [BookingStatus.APPROVED]: NotificationTemplate.BOOKING_APPROVED,
  [BookingStatus.REJECTED]: NotificationTemplate.BOOKING_REJECTED,
};
