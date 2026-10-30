import { createHmac, timingSafeEqual } from 'crypto';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { VNPAY_DATE_FORMAT, VNPAY_HASH_FIELDS } from './payments.constants';
import { VnpayParams } from './payments.interface';

const encode = (value: string) =>
  encodeURIComponent(value).replace(/%20/g, '+');

export function toVnpayQuery(params: VnpayParams): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join('&');
}

export function signVnpayParams(
  params: VnpayParams,
  hashSecret: string,
): string {
  return createHmac('sha512', hashSecret)
    .update(toVnpayQuery(params), 'utf8')
    .digest('hex');
}

export function verifyVnpaySignature(
  query: VnpayParams,
  hashSecret: string,
): boolean {
  if (Object.values(query).some((value) => typeof value !== 'string')) {
    return false;
  }
  const received = query.vnp_SecureHash ?? '';
  const params = Object.fromEntries(
    Object.entries(query).filter(([key]) => !VNPAY_HASH_FIELDS.includes(key)),
  );
  const expected = Buffer.from(signVnpayParams(params, hashSecret));
  const actual = Buffer.from(received.toLowerCase());
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function formatVnpayDate(date: Date): string {
  return new Intl.DateTimeFormat(VNPAY_DATE_FORMAT, {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replace(/\D/g, '');
}
