import { CHILD_PRICE_RATE } from './bookings.constants';

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
  return new Date().toISOString().slice(0, 10);
}
