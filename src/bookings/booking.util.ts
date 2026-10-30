import { todayInAppTimezone } from '../common/time/date.util';
import { APP_UTC_OFFSET } from '../common/time/time.constants';
import {
  BOOKING_PAYMENT_HOLD_MS,
  CHILD_PRICE_RATE,
} from './bookings.constants';

export function calculateTotalPrice(
  price: number,
  numberOfAdults: number,
  numberOfChildren: number,
): number {
  return price * numberOfAdults + price * CHILD_PRICE_RATE * numberOfChildren;
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function today(): string {
  return todayInAppTimezone();
}

export function paymentDeadline(startDate: string, now = new Date()): Date {
  const departure = new Date(`${startDate}T00:00:00${APP_UTC_OFFSET}`);
  return new Date(
    Math.min(now.getTime() + BOOKING_PAYMENT_HOLD_MS, departure.getTime()),
  );
}
