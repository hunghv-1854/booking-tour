import { addDays, calculateTotalPrice, paymentDeadline } from './booking.util';

describe('booking.util', () => {
  describe('calculateTotalPrice', () => {
    it('charges children at half price', () => {
      expect(calculateTotalPrice(1_000_000, 2, 1)).toBe(2_500_000);
    });

    it('charges only adults when there are no children', () => {
      expect(calculateTotalPrice(1_000_000, 3, 0)).toBe(3_000_000);
    });
  });

  describe('addDays', () => {
    it('adds days across month boundaries', () => {
      expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    });

    it('subtracts days with a negative offset', () => {
      expect(addDays('2026-11-10', -2)).toBe('2026-11-08');
    });
  });

  describe('paymentDeadline', () => {
    const now = new Date('2026-10-20T03:00:00Z');

    it('holds the booking for 24 hours when departure is later', () => {
      expect(paymentDeadline('2026-10-30', now)).toEqual(
        new Date('2026-10-21T03:00:00Z'),
      );
    });

    it('never goes past midnight of the departure day in Vietnam time', () => {
      expect(paymentDeadline('2026-10-21', now)).toEqual(
        new Date('2026-10-20T17:00:00Z'),
      );
    });
  });
});
