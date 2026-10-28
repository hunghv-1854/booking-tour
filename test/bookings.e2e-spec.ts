import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { BookingStatus } from '../src/bookings/booking-status.enum';
import { Booking } from '../src/bookings/booking.entity';
import { addDays, today } from '../src/bookings/booking.util';
import { Tour } from '../src/tours/tour.entity';
import {
  BookingFixtures,
  seedBookingFixtures,
} from './fixtures/booking.fixtures';
import { loginAs } from './helpers/auth';
import { truncateAllTables } from './helpers/database';
import { createTestApp, TestApp } from './helpers/test-app';

describe('Bookings (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let fixtures: BookingFixtures;
  let aliceToken: string;
  let bobToken: string;
  let adminToken: string;

  const availableSlotOf = async (tourId: number) =>
    (await dataSource.getRepository(Tour).findOneByOrFail({ id: tourId }))
      .availableSlot;
  const statusOf = async (bookingId: number) =>
    (await dataSource.getRepository(Booking).findOneByOrFail({ id: bookingId }))
      .status;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
  });

  beforeEach(async () => {
    fixtures = await seedBookingFixtures(dataSource);
    [aliceToken, bobToken, adminToken] = await Promise.all([
      loginAs(app, fixtures.alice.email),
      loginAs(app, fixtures.bob.email),
      loginAs(app, fixtures.admin.email),
    ]);
  });

  afterEach(async () => {
    await truncateAllTables(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/bookings', () => {
    const validBody = () => ({
      tourId: fixtures.upcomingTour.id,
      startDate: addDays(today(), 12),
      numberOfAdults: 2,
      numberOfChildren: 2,
      note: 'Ăn chay',
    });

    it('requires authentication', () =>
      request(app.getHttpServer())
        .post('/api/bookings')
        .send(validBody())
        .expect(401));

    it('validates the body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send({ tourId: 'x', startDate: '2026-13-01', numberOfAdults: 0 })
        .expect(422);

      expect(Object.keys(response.body.errors)).toEqual(
        expect.arrayContaining(['tourId', 'startDate', 'numberOfAdults']),
      );
    });

    it('rejects an unknown tour', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send({ ...validBody(), tourId: 999_999 })
        .expect(422);

      expect(response.body.errors).toEqual({
        tourId: ['Tour was not found'],
      });
    });

    it('rejects a start date before the tour opens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings?lang=vi')
        .set('Authorization', aliceToken)
        .send({ ...validBody(), startDate: addDays(today(), 9) })
        .expect(422);

      expect(response.body.errors.startDate[0]).toBe(
        `phải nằm trong khoảng ${addDays(today(), 10)} đến ${addDays(today(), 18)}`,
      );
    });

    it('rejects a start date too late to fit the tour duration', () =>
      request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send({ ...validBody(), startDate: addDays(today(), 19) })
        .expect(422));

    it('rejects a past start date on a tour that has already opened', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send({
          ...validBody(),
          tourId: fixtures.ongoingTour.id,
          startDate: addDays(today(), -1),
        })
        .expect(422);

      expect(response.body.errors.startDate[0]).toContain(today());
    });

    it('accepts today on a tour that has already opened', () =>
      request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send({
          ...validBody(),
          tourId: fixtures.ongoingTour.id,
          startDate: today(),
        })
        .expect(201));

    it('rejects when there are not enough slots and keeps the slots unchanged', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings?lang=vi')
        .set('Authorization', aliceToken)
        .send({ ...validBody(), tourId: fixtures.fullTour.id })
        .expect(409);

      expect(response.body.message).toBe('Tour chỉ còn 1 slot');
      expect(await availableSlotOf(fixtures.fullTour.id)).toBe(1);
    });

    it('creates a pending booking, reserves slots and computes the price', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send(validBody())
        .expect(201);

      expect(response.body).toMatchObject({
        status: BookingStatus.PENDING,
        totalPrice: 3_000_000,
        numberOfAdults: 2,
        numberOfChildren: 2,
        note: 'Ăn chay',
        tour: { id: fixtures.upcomingTour.id, name: 'Tour Phú Quốc' },
      });
      expect(await availableSlotOf(fixtures.upcomingTour.id)).toBe(3);
    });

    it('defaults numberOfChildren to 0', async () => {
      const body = {
        tourId: fixtures.upcomingTour.id,
        startDate: addDays(today(), 12),
        numberOfAdults: 2,
      };
      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', aliceToken)
        .send(body)
        .expect(201);

      expect(response.body).toMatchObject({
        numberOfChildren: 0,
        totalPrice: 2_000_000,
      });
    });

    it('never oversells under concurrent requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .post('/api/bookings')
            .set('Authorization', bobToken)
            .send({
              tourId: fixtures.fullTour.id,
              startDate: addDays(today(), 12),
              numberOfAdults: 1,
            }),
        ),
      );

      const statuses = responses.map((response) => response.status).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409]);
      expect(await availableSlotOf(fixtures.fullTour.id)).toBe(0);
    });
  });

  describe('GET /api/bookings/me', () => {
    it('lists only my bookings, newest first', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/bookings/me')
        .set('Authorization', aliceToken)
        .expect(200);

      expect(response.body.meta).toEqual({ page: 1, limit: 10, total: 2 });
      expect(
        (response.body.data as Booking[]).map((item: Booking) => item.id),
      ).toEqual([fixtures.aliceApproved.id, fixtures.alicePending.id]);
      expect(response.body.data[0]).toHaveProperty('tour.name');
      expect(response.body.data[0]).not.toHaveProperty('userId');
    });

    it('filters by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/bookings/me')
        .query({ status: BookingStatus.APPROVED })
        .set('Authorization', aliceToken)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(fixtures.aliceApproved.id);
    });

    it('filters by tour name keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/bookings/me')
        .query({ keyword: 'đà lạt' })
        .set('Authorization', aliceToken)
        .expect(200);

      expect(
        (response.body.data as Booking[]).map((item: Booking) => item.id),
      ).toEqual([fixtures.aliceApproved.id]);
    });

    it('paginates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/bookings/me')
        .query({ page: 2, limit: 1 })
        .set('Authorization', aliceToken)
        .expect(200);

      expect(response.body.meta).toEqual({ page: 2, limit: 1, total: 2 });
      expect(response.body.data[0].id).toBe(fixtures.alicePending.id);
    });

    it('rejects an invalid status filter', () =>
      request(app.getHttpServer())
        .get('/api/bookings/me')
        .query({ status: 'done' })
        .set('Authorization', aliceToken)
        .expect(422));
  });

  describe('GET /api/bookings/:id', () => {
    it('returns my booking', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/bookings/${fixtures.alicePending.id}`)
        .set('Authorization', aliceToken)
        .expect(200);

      expect(response.body).toMatchObject({
        id: fixtures.alicePending.id,
        totalPrice: 2_500_000,
        tour: { id: fixtures.upcomingTour.id },
      });
    });

    it("hides another user's booking as not found", () =>
      request(app.getHttpServer())
        .get(`/api/bookings/${fixtures.bobPending.id}`)
        .set('Authorization', aliceToken)
        .expect(404));

    it('rejects a non-numeric id', () =>
      request(app.getHttpServer())
        .get('/api/bookings/abc')
        .set('Authorization', aliceToken)
        .expect(400));
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    it('cancels my pending booking and releases its slots', async () => {
      await request(app.getHttpServer())
        .patch(`/api/bookings/${fixtures.alicePending.id}/cancel`)
        .set('Authorization', aliceToken)
        .expect(200)
        .expect({ id: fixtures.alicePending.id, status: 'cancelled' });

      expect(await availableSlotOf(fixtures.upcomingTour.id)).toBe(10);
    });

    it('refuses to cancel a booking that is no longer pending', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/bookings/${fixtures.aliceApproved.id}/cancel?lang=vi`)
        .set('Authorization', aliceToken)
        .expect(409);

      expect(response.body.message).toBe(
        'Chỉ booking đang chờ duyệt mới được huỷ',
      );
      expect(await statusOf(fixtures.aliceApproved.id)).toBe(
        BookingStatus.APPROVED,
      );
    });

    it("cannot cancel another user's booking", async () => {
      await request(app.getHttpServer())
        .patch(`/api/bookings/${fixtures.bobPending.id}/cancel`)
        .set('Authorization', aliceToken)
        .expect(404);

      expect(await statusOf(fixtures.bobPending.id)).toBe(
        BookingStatus.PENDING,
      );
    });
  });

  describe('Admin /api/admin/bookings', () => {
    it('is forbidden for regular users', () =>
      request(app.getHttpServer())
        .get('/api/admin/bookings')
        .set('Authorization', aliceToken)
        .expect(403));

    it('lists every booking with user info and filters by user email', async () => {
      const all = await request(app.getHttpServer())
        .get('/api/admin/bookings')
        .set('Authorization', adminToken)
        .expect(200);
      expect(all.body.meta.total).toBe(3);
      expect(all.body.data[0]).toHaveProperty('user.email');

      const filtered = await request(app.getHttpServer())
        .get('/api/admin/bookings')
        .query({ keyword: 'bob@', status: BookingStatus.PENDING })
        .set('Authorization', adminToken)
        .expect(200);
      expect(
        (filtered.body.data as Booking[]).map((item: Booking) => item.id),
      ).toEqual([fixtures.bobPending.id]);
    });

    it('returns a booking detail or 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/bookings/${fixtures.bobPending.id}`)
        .set('Authorization', adminToken)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/admin/bookings/999999')
        .set('Authorization', adminToken)
        .expect(404);
    });

    it('approves a pending booking without releasing slots and queues an email', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/bookings/${fixtures.alicePending.id}/approve`)
        .set('Authorization', adminToken)
        .expect(200)
        .expect({ id: fixtures.alicePending.id, status: 'approved' });

      const approved = await dataSource
        .getRepository(Booking)
        .findOneByOrFail({ id: fixtures.alicePending.id });
      expect(approved.paymentDueAt!.getTime()).toBeGreaterThan(Date.now());
      expect(await availableSlotOf(fixtures.upcomingTour.id)).toBe(7);
      expect(testApp.notifications.notifyStatusChanged).toHaveBeenCalledWith(
        fixtures.alicePending.id,
        BookingStatus.APPROVED,
      );
    });

    it('rejects with a reason, releases slots and queues an email', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/bookings/${fixtures.alicePending.id}/reject`)
        .set('Authorization', adminToken)
        .send({ reason: 'Hết xe' })
        .expect(200);

      const booking = await dataSource
        .getRepository(Booking)
        .findOneByOrFail({ id: fixtures.alicePending.id });
      expect(booking).toMatchObject({
        status: BookingStatus.REJECTED,
        rejectReason: 'Hết xe',
      });
      expect(await availableSlotOf(fixtures.upcomingTour.id)).toBe(10);
      expect(testApp.notifications.notifyStatusChanged).toHaveBeenCalledWith(
        fixtures.alicePending.id,
        BookingStatus.REJECTED,
      );
    });

    it('requires a reject reason', () =>
      request(app.getHttpServer())
        .patch(`/api/admin/bookings/${fixtures.alicePending.id}/reject`)
        .set('Authorization', adminToken)
        .send({})
        .expect(422));

    it('refuses to change a booking that is no longer pending and sends no email', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/bookings/${fixtures.aliceApproved.id}/approve`)
        .set('Authorization', adminToken)
        .expect(409);
      await request(app.getHttpServer())
        .patch('/api/admin/bookings/999999/reject')
        .set('Authorization', adminToken)
        .send({ reason: 'x' })
        .expect(404);

      expect(testApp.notifications.notifyStatusChanged).not.toHaveBeenCalled();
    });
  });
});
