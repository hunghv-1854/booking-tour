import { PaymentStatus } from './payment-status.enum';

export const VNPAY_VERSION = '2.1.0';
export const VNPAY_COMMAND = 'pay';
export const VNPAY_CURRENCY = 'VND';
export const VNPAY_LOCALE = 'vn';
export const VNPAY_ORDER_TYPE = 'other';
export const VNPAY_AMOUNT_MULTIPLIER = 100;
export const VNPAY_SUCCESS_CODE = '00';
export const VNPAY_DATE_FORMAT = 'sv-SE';
export const VNPAY_HASH_FIELDS = ['vnp_SecureHash', 'vnp_SecureHashType'];

export const PAYMENT_LINK_TTL_MS = 15 * 60 * 1000;
export const PAYMENT_IPN_GRACE_MS = 15 * 60 * 1000;
export const PAYMENT_EXPIRATION_CRON = '0 */5 * * * *';
export const BOOKING_PAYMENT_EXPIRATION_CRON = '0 */15 * * * *';

export const IPN_RESPONSES = {
  success: { RspCode: '00', Message: 'Confirm Success' },
  notFound: { RspCode: '01', Message: 'Order not found' },
  alreadyConfirmed: { RspCode: '02', Message: 'Order already confirmed' },
  invalidAmount: { RspCode: '04', Message: 'Invalid amount' },
  invalidSignature: { RspCode: '97', Message: 'Invalid signature' },
  unknownError: { RspCode: '99', Message: 'Unknown error' },
} as const;

export const IPN_PROCESSABLE_STATUSES = [
  PaymentStatus.PENDING,
  PaymentStatus.EXPIRED,
];

export const PAYMENT_BOOKING_SELECT = {
  id: true,
  userId: true,
  status: true,
  paymentStatus: true,
  paymentDueAt: true,
  totalPrice: true,
} as const;

export const PAYMENT_IPN_SELECT = {
  id: true,
  bookingId: true,
  amount: true,
  status: true,
} as const;

export const PAYMENT_LINK_SELECT = {
  id: true,
  txnRef: true,
  amount: true,
  expiresAt: true,
} as const;
