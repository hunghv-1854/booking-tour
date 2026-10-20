export const BOOKING_NOTIFICATION_QUEUE = 'booking-notifications';
export const BOOKING_STATUS_CHANGED_JOB = 'booking-status-changed';

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
