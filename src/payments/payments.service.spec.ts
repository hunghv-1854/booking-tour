import { ConflictException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { BookingPaymentStatus } from '../bookings/booking-payment-status.enum';
import { BookingStatus } from '../bookings/booking-status.enum';
import { Booking } from '../bookings/booking.entity';
import { createI18nMock } from '../common/testing/i18n.mock';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { PaymentStatus } from './payment-status.enum';
import { Payment } from './payment.entity';
import { IPN_RESPONSES } from './payments.constants';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';

describe('PaymentsService', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_entity: unknown, data: unknown) => data),
    update: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((work: (m: typeof manager) => Promise<unknown>) =>
      work(manager),
    ),
  };
  const vnpay = {
    buildPaymentUrl: jest.fn(() => 'https://vnpay.test/pay'),
    verify: jest.fn(() => true),
    toVnpayAmount: (amount: number) => String(amount * 100),
  };
  const notifications = { notifyMany: jest.fn() };
  const service = new PaymentsService(
    dataSource as unknown as DataSource,
    vnpay as unknown as VnpayService,
    notifications as unknown as BookingNotificationService,
    createI18nMock() as unknown as I18nService,
  );

  const payableBooking = {
    id: 5,
    status: BookingStatus.APPROVED,
    paymentStatus: BookingPaymentStatus.UNPAID,
    paymentDueAt: new Date(Date.now() + 60 * 60 * 1000),
    totalPrice: 1_000_000,
  };
  const pendingPayment = {
    id: 9,
    bookingId: 5,
    txnRef: '5-1',
    amount: 1_000_000,
    status: PaymentStatus.PENDING,
  };
  const ipn = {
    vnp_TxnRef: '5-1',
    vnp_Amount: '100000000',
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_SecureHash: 'hash',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  describe('create', () => {
    it.each([
      { status: BookingStatus.PENDING },
      { paymentStatus: BookingPaymentStatus.PAID },
      { paymentDueAt: new Date(Date.now() - 1000) },
    ])('refuses a booking that cannot be paid (%o)', async (override) => {
      manager.findOne.mockResolvedValueOnce({ ...payableBooking, ...override });

      await expect(service.create(7, 5, '127.0.0.1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('caps the link expiry at the booking payment deadline', async () => {
      const dueSoon = new Date(Date.now() + 60 * 1000);
      manager.findOne
        .mockResolvedValueOnce({ ...payableBooking, paymentDueAt: dueSoon })
        .mockResolvedValueOnce(null);
      manager.save.mockImplementation((data: Payment) => ({ ...data, id: 1 }));

      const link = await service.create(7, 5, '127.0.0.1');

      expect(link.expiresAt).toEqual(dueSoon);
      expect(link.paymentUrl).toBe('https://vnpay.test/pay');
    });
  });

  describe('handleIpn', () => {
    it('does not touch the database when the signature is invalid', async () => {
      vnpay.verify.mockReturnValueOnce(false);

      await expect(service.handleIpn(ipn)).resolves.toEqual(
        IPN_RESPONSES.invalidSignature,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('marks the booking paid and queues the email inside the transaction', async () => {
      manager.findOne
        .mockResolvedValueOnce(pendingPayment)
        .mockResolvedValueOnce(payableBooking);

      await expect(service.handleIpn(ipn)).resolves.toEqual(
        IPN_RESPONSES.success,
      );
      expect(manager.update).toHaveBeenCalledWith(Booking, 5, {
        paymentStatus: BookingPaymentStatus.PAID,
      });
      expect(notifications.notifyMany).toHaveBeenCalledWith(
        [5],
        NotificationTemplate.PAYMENT_SUCCEEDED,
      );
    });

    it('answers 99 so VNPay retries when processing fails', async () => {
      manager.findOne
        .mockResolvedValueOnce(pendingPayment)
        .mockResolvedValueOnce(payableBooking);
      notifications.notifyMany.mockRejectedValueOnce(new Error('redis down'));

      await expect(service.handleIpn(ipn)).resolves.toEqual(
        IPN_RESPONSES.unknownError,
      );
    });
  });
});
