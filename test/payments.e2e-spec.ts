import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { BookingPaymentStatus } from '../src/bookings/booking-payment-status.enum';
import { BookingStatus } from '../src/bookings/booking-status.enum';
import { Booking } from '../src/bookings/booking.entity';
import { addDays, today } from '../src/bookings/booking.util';
import { NotificationTemplate } from '../src/notifications/notification-template.enum';
import { BookingPaymentExpirationTask } from '../src/payments/booking-payment-expiration.task';
import { PaymentExpirationTask } from '../src/payments/payment-expiration.task';
import { PaymentStatus } from '../src/payments/payment-status.enum';
import { Payment } from '../src/payments/payment.entity';
import {
  signVnpayParams,
  verifyVnpaySignature,
} from '../src/payments/vnpay.util';
import { Tour } from '../src/tours/tour.entity';
import {
  BookingFixtures,
  seedBookingFixtures,
} from './fixtures/booking.fixtures';
import { loginAs } from './helpers/auth';
import { truncateAllTables } from './helpers/database';
import { createTestApp, TestApp } from './helpers/test-app';

const HASH_SECRET = 'e2e-vnpay-hash-secret';
const HOUR = 60 * 60 * 1000;

describe('Payments (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let bookings: Repository<Booking>;
  let payments: Repository<Payment>;
  let fixtures: BookingFixtures;
  let aliceToken: string;
  let booking: Booking;

  const createPayment = (bookingId: number, token = aliceToken) =>
    request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', token)
      .send({ bookingId });
  const signedQuery = (params: Record<string, string>) => ({
    ...params,
    vnp_SecureHash: signVnpayParams(params, HASH_SECRET),
  });
  const ipnQuery = (payment: Payment, overrides = {}) =>
    signedQuery({
      vnp_TxnRef: payment.txnRef,
      vnp_Amount: String(payment.amount * 100),
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: '14000001',
      vnp_BankCode: 'NCB',
      vnp_OrderInfo: 'Thanh toan booking',
      ...overrides,
    });
  const sendIpn = (query: Record<string, string>) =>
    request(app.getHttpServer())
      .get('/api/payments/vnpay/ipn')
      .query(query)
      .expect(200);
  const seedApprovedBooking = (data: Partial<Booking>) =>
    bookings.save({
      userId: fixtures.alice.id,
      tourId: fixtures.upcomingTour.id,
      startDate: addDays(today(), 12),
      numberOfAdults: 2,
      numberOfChildren: 0,
      totalPrice: 2_000_000,
      status: BookingStatus.APPROVED,
      ...data,
    });
  const seedPayment = (data: Partial<Payment> = {}) =>
    payments.save({
      bookingId: booking.id,
      txnRef: `${booking.id}-${Date.now()}`,
      amount: booking.totalPrice,
      expiresAt: new Date(Date.now() + HOUR),
      ...data,
    });

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    bookings = dataSource.getRepository(Booking);
    payments = dataSource.getRepository(Payment);
  });

  beforeEach(async () => {
    fixtures = await seedBookingFixtures(dataSource);
    aliceToken = await loginAs(app, fixtures.alice.email);
    booking = await seedApprovedBooking({
      paymentDueAt: new Date(Date.now() + 24 * HOUR),
    });
  });

  afterEach(async () => {
    await truncateAllTables(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/payments', () => {
    it('requires authentication', () =>
      request(app.getHttpServer())
        .post('/api/payments')
        .send({ bookingId: booking.id })
        .expect(401));

    it('returns a signed VNPay link and reuses the pending payment', async () => {
      const first = await createPayment(booking.id).expect(201);
      const body = first.body as { txnRef: string; paymentUrl: string };
      const url = new URL(body.paymentUrl);
      const query = Object.fromEntries(url.searchParams);

      expect(url.origin + url.pathname).toBe(
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      );
      expect(query).toMatchObject({
        vnp_TmnCode: 'E2ETEST1',
        vnp_TxnRef: body.txnRef,
        vnp_Amount: '200000000',
      });
      expect(verifyVnpaySignature(query, HASH_SECRET)).toBe(true);

      const second = await createPayment(booking.id).expect(201);
      expect((second.body as { txnRef: string }).txnRef).toBe(body.txnRef);
      expect(await payments.count()).toBe(1);
    });

    it("hides other users' bookings", async () => {
      const bobToken = await loginAs(app, fixtures.bob.email);
      await createPayment(booking.id, bobToken).expect(404);
    });

    it('rejects bookings that are not payable', async () => {
      await createPayment(fixtures.alicePending.id).expect(409);
      await bookings.update(booking.id, {
        paymentDueAt: new Date(Date.now() - HOUR),
      });
      await createPayment(booking.id).expect(409);
      expect(await payments.count()).toBe(0);
    });
  });

  describe('GET /api/payments/vnpay/ipn', () => {
    it('confirms a successful payment once and marks the booking paid', async () => {
      const payment = await seedPayment();

      await sendIpn(ipnQuery(payment)).expect({
        RspCode: '00',
        Message: 'Confirm Success',
      });
      await sendIpn(ipnQuery(payment)).expect({
        RspCode: '02',
        Message: 'Order already confirmed',
      });

      expect(await payments.findOneByOrFail({ id: payment.id })).toMatchObject({
        status: PaymentStatus.SUCCEEDED,
        transactionNo: '14000001',
        bankCode: 'NCB',
      });
      expect(
        (await bookings.findOneByOrFail({ id: booking.id })).paymentStatus,
      ).toBe(BookingPaymentStatus.PAID);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledTimes(1);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledWith(
        [booking.id],
        NotificationTemplate.PAYMENT_SUCCEEDED,
      );
    });

    it('records a failed payment without paying the booking', async () => {
      const payment = await seedPayment();

      await sendIpn(ipnQuery(payment, { vnp_ResponseCode: '24' })).expect({
        RspCode: '00',
        Message: 'Confirm Success',
      });

      expect((await payments.findOneByOrFail({ id: payment.id })).status).toBe(
        PaymentStatus.FAILED,
      );
      expect(
        (await bookings.findOneByOrFail({ id: booking.id })).paymentStatus,
      ).toBe(BookingPaymentStatus.UNPAID);
    });

    it('still pays the booking when the success IPN arrives after the payment expired', async () => {
      const payment = await seedPayment({ status: PaymentStatus.EXPIRED });

      await sendIpn(ipnQuery(payment)).expect({
        RspCode: '00',
        Message: 'Confirm Success',
      });

      expect((await payments.findOneByOrFail({ id: payment.id })).status).toBe(
        PaymentStatus.SUCCEEDED,
      );
      expect(
        (await bookings.findOneByOrFail({ id: booking.id })).paymentStatus,
      ).toBe(BookingPaymentStatus.PAID);
    });

    it('flags a refund when the booking can no longer be paid', async () => {
      const payment = await seedPayment();
      await bookings.update(booking.id, { status: BookingStatus.CANCELLED });

      await sendIpn(ipnQuery(payment)).expect({
        RspCode: '00',
        Message: 'Confirm Success',
      });

      expect((await payments.findOneByOrFail({ id: payment.id })).status).toBe(
        PaymentStatus.NEEDS_REFUND,
      );
      expect(await bookings.findOneByOrFail({ id: booking.id })).toMatchObject({
        status: BookingStatus.CANCELLED,
        paymentStatus: BookingPaymentStatus.UNPAID,
      });
      expect(testApp.notifications.notifyMany).not.toHaveBeenCalled();
    });

    it('rejects tampered, unknown and wrong-amount notifications', async () => {
      const payment = await seedPayment();

      await sendIpn({ ...ipnQuery(payment), vnp_Amount: '1' }).expect({
        RspCode: '97',
        Message: 'Invalid signature',
      });
      await request(app.getHttpServer())
        .get('/api/payments/vnpay/ipn?vnp_SecureHash[]=x&vnp_TxnRef[]=y')
        .expect(200)
        .expect({ RspCode: '97', Message: 'Invalid signature' });
      await sendIpn(ipnQuery(payment, { vnp_TxnRef: 'unknown' })).expect({
        RspCode: '01',
        Message: 'Order not found',
      });
      await sendIpn(ipnQuery(payment, { vnp_Amount: '100' })).expect({
        RspCode: '04',
        Message: 'Invalid amount',
      });

      expect((await payments.findOneByOrFail({ id: payment.id })).status).toBe(
        PaymentStatus.PENDING,
      );
    });
  });

  describe('GET /api/payments/vnpay/return', () => {
    it('reports the result only when the signature is valid', async () => {
      const payment = await seedPayment();
      const query = ipnQuery(payment);

      await request(app.getHttpServer())
        .get('/api/payments/vnpay/return')
        .query(query)
        .expect(200)
        .expect({ success: true, txnRef: payment.txnRef, responseCode: '00' });
      await request(app.getHttpServer())
        .get('/api/payments/vnpay/return')
        .query({ ...query, vnp_SecureHash: 'forged' })
        .expect(200)
        .expect({ success: false, txnRef: payment.txnRef, responseCode: '00' });
      expect((await payments.findOneByOrFail({ id: payment.id })).status).toBe(
        PaymentStatus.PENDING,
      );
    });
  });

  describe('Scheduled payment jobs', () => {
    it('expires pending payments after the link and grace period end', async () => {
      const stale = await seedPayment({
        expiresAt: new Date(Date.now() - HOUR),
      });
      const inGrace = await seedPayment({
        txnRef: 'in-grace',
        expiresAt: new Date(Date.now() - 60 * 1000),
      });

      const ids = await app.get(PaymentExpirationTask).expireStalePayments();

      expect(ids).toEqual([stale.id]);
      expect((await payments.findOneByOrFail({ id: inGrace.id })).status).toBe(
        PaymentStatus.PENDING,
      );
    });

    it('cancels overdue unpaid bookings, releases slots and skips those still paying', async () => {
      const overdue = new Date(Date.now() - HOUR);
      await bookings.update(booking.id, { paymentDueAt: overdue });
      const paying = await seedApprovedBooking({ paymentDueAt: overdue });
      await payments.save({
        bookingId: paying.id,
        txnRef: 'still-paying',
        amount: paying.totalPrice,
        expiresAt: new Date(Date.now() - 60 * 1000),
      });
      const tours = dataSource.getRepository(Tour);
      const slotsBefore = (
        await tours.findOneByOrFail({ id: fixtures.upcomingTour.id })
      ).availableSlot;

      const ids = await app
        .get(BookingPaymentExpirationTask)
        .cancelUnpaidBookings();

      expect(ids).toEqual([booking.id]);
      expect((await bookings.findOneByOrFail({ id: booking.id })).status).toBe(
        BookingStatus.CANCELLED,
      );
      expect((await bookings.findOneByOrFail({ id: paying.id })).status).toBe(
        BookingStatus.APPROVED,
      );
      expect(
        (await tours.findOneByOrFail({ id: fixtures.upcomingTour.id }))
          .availableSlot,
      ).toBe(slotsBefore + 2);
      expect(testApp.notifications.notifyMany).toHaveBeenCalledWith(
        [booking.id],
        NotificationTemplate.BOOKING_PAYMENT_EXPIRED,
      );
    });
  });
});
