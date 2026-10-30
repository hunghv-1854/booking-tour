import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingCompletionTask } from '../src/bookings/booking-completion.task';
import { BookingExpirationTask } from '../src/bookings/booking-expiration.task';
import { BookingReminderTask } from '../src/bookings/booking-reminder.task';
import { BookingPaymentStatus } from '../src/bookings/booking-payment-status.enum';
import { BookingStatus } from '../src/bookings/booking-status.enum';
import { Booking } from '../src/bookings/booking.entity';
import { addDays, today } from '../src/bookings/booking.util';
import { NotificationTemplate } from '../src/notifications/notification-template.enum';
import { Tour } from '../src/tours/tour.entity';
import {
  BookingFixtures,
  seedBookingFixtures,
} from './fixtures/booking.fixtures';
import { truncateAllTables } from './helpers/database';
import { createTestApp, TestApp } from './helpers/test-app';

describe('Scheduled jobs (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let bookings: Repository<Booking>;
  let fixtures: BookingFixtures;

  const seedBooking = (data: Partial<Booking>) =>
    bookings.save({
      userId: fixtures.alice.id,
      tourId: fixtures.ongoingTour.id,
      numberOfAdults: 2,
      numberOfChildren: 1,
      totalPrice: 2_500_000,
      ...data,
    });
  const availableSlotOf = async (tourId: number) =>
    (await dataSource.getRepository(Tour).findOneByOrFail({ id: tourId }))
      .availableSlot;
  const statusOf = async (id: number) =>
    (await bookings.findOneByOrFail({ id })).status;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    bookings = dataSource.getRepository(Booking);
  });

  beforeEach(async () => {
    fixtures = await seedBookingFixtures(dataSource);
  });

  afterEach(async () => {
    await truncateAllTables(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('BookingExpirationTask', () => {
    it('rejects pending bookings that reached departure, releases slots and notifies', async () => {
      const expired = await seedBooking({
        status: BookingStatus.PENDING,
        startDate: today(),
      });
      const future = await seedBooking({
        status: BookingStatus.PENDING,
        startDate: addDays(today(), 1),
      });

      const ids = await app
        .get(BookingExpirationTask)
        .rejectExpiredPendingBookings();

      expect(ids).toEqual([expired.id]);
      expect(await bookings.findOneByOrFail({ id: expired.id })).toMatchObject({
        status: BookingStatus.REJECTED,
        rejectReason: 'Booking chưa được duyệt trước ngày khởi hành',
      });
      expect(await statusOf(future.id)).toBe(BookingStatus.PENDING);
      expect(await availableSlotOf(fixtures.ongoingTour.id)).toBe(13);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledWith(
        [expired.id],
        NotificationTemplate.BOOKING_REJECTED,
      );
    });

    it('rolls back when notifications cannot be queued so the next run retries', async () => {
      const expired = await seedBooking({
        status: BookingStatus.PENDING,
        startDate: today(),
      });
      const slotsBefore = await availableSlotOf(fixtures.ongoingTour.id);
      testApp.notifications.notifyMany.mockRejectedValueOnce(
        new Error('redis down'),
      );
      const task = app.get(BookingExpirationTask);

      await expect(task.rejectExpiredPendingBookings()).resolves.toEqual([]);
      expect(await statusOf(expired.id)).toBe(BookingStatus.PENDING);
      expect(await availableSlotOf(fixtures.ongoingTour.id)).toBe(slotsBefore);

      await expect(task.rejectExpiredPendingBookings()).resolves.toEqual([
        expired.id,
      ]);
      expect(await statusOf(expired.id)).toBe(BookingStatus.REJECTED);
    });

    it('is idempotent', async () => {
      await seedBooking({ status: BookingStatus.PENDING, startDate: today() });
      const task = app.get(BookingExpirationTask);

      await task.rejectExpiredPendingBookings();
      const second = await task.rejectExpiredPendingBookings();

      expect(second).toEqual([]);
      expect(await availableSlotOf(fixtures.ongoingTour.id)).toBe(13);
    });
  });

  describe('BookingReminderTask', () => {
    it('reminds only paid approved bookings departing tomorrow', async () => {
      const tomorrow = await seedBooking({
        status: BookingStatus.APPROVED,
        paymentStatus: BookingPaymentStatus.PAID,
        startDate: addDays(today(), 1),
      });
      await seedBooking({
        status: BookingStatus.APPROVED,
        startDate: addDays(today(), 1),
      });
      await seedBooking({
        status: BookingStatus.PENDING,
        startDate: addDays(today(), 1),
      });
      await seedBooking({
        status: BookingStatus.APPROVED,
        paymentStatus: BookingPaymentStatus.PAID,
        startDate: addDays(today(), 2),
      });

      const ids = await app.get(BookingReminderTask).remindUpcomingDepartures();

      expect(ids).toEqual([tomorrow.id]);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledWith(
        [tomorrow.id],
        NotificationTemplate.BOOKING_REMINDER,
      );
    });
  });

  describe('BookingCompletionTask', () => {
    it('completes approved bookings after the tour ends and invites a review', async () => {
      const finished = await seedBooking({
        status: BookingStatus.APPROVED,
        startDate: addDays(today(), -3),
      });
      const endingToday = await seedBooking({
        status: BookingStatus.APPROVED,
        startDate: addDays(today(), -2),
      });
      const rejected = await seedBooking({
        status: BookingStatus.REJECTED,
        startDate: addDays(today(), -3),
      });

      const ids = await app
        .get(BookingCompletionTask)
        .completeFinishedBookings();

      expect(ids).toEqual([finished.id]);
      expect(await statusOf(finished.id)).toBe(BookingStatus.COMPLETED);
      expect(await statusOf(endingToday.id)).toBe(BookingStatus.APPROVED);
      expect(await statusOf(rejected.id)).toBe(BookingStatus.REJECTED);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledWith(
        [finished.id],
        NotificationTemplate.REVIEW_INVITATION,
      );
    });
  });
});
