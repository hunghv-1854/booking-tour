import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, MoreThan } from 'typeorm';
import { BookingPaymentStatus } from '../bookings/booking-payment-status.enum';
import { BookingStatus } from '../bookings/booking-status.enum';
import { Booking } from '../bookings/booking.entity';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { PaymentStatus } from './payment-status.enum';
import { Payment } from './payment.entity';
import {
  IPN_PROCESSABLE_STATUSES,
  IPN_RESPONSES,
  PAYMENT_BOOKING_SELECT,
  PAYMENT_IPN_SELECT,
  PAYMENT_LINK_TTL_MS,
  VNPAY_SUCCESS_CODE,
} from './payments.constants';
import {
  IpnResponse,
  PaymentLink,
  PaymentReturnResult,
  VnpayParams,
} from './payments.interface';
import { VnpayService } from './vnpay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly vnpayService: VnpayService,
    private readonly bookingNotificationService: BookingNotificationService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    userId: number,
    bookingId: number,
    ipAddr: string,
  ): Promise<PaymentLink> {
    const payment = await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId, userId },
        select: PAYMENT_BOOKING_SELECT,
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) {
        throw new NotFoundException(this.i18n.t('bookings.not_found'));
      }
      if (
        booking.status !== BookingStatus.APPROVED ||
        booking.paymentStatus !== BookingPaymentStatus.UNPAID ||
        !booking.paymentDueAt
      ) {
        throw new ConflictException(
          this.i18n.t('payments.booking_not_payable'),
        );
      }

      const now = new Date();
      if (booking.paymentDueAt <= now) {
        throw new ConflictException(
          this.i18n.t('payments.payment_deadline_passed'),
        );
      }

      const pending = await manager.findOne(Payment, {
        where: {
          bookingId,
          status: PaymentStatus.PENDING,
          expiresAt: MoreThan(now),
        },
      });
      if (pending) return pending;

      return manager.save(
        manager.create(Payment, {
          bookingId,
          txnRef: `${bookingId}-${now.getTime()}`,
          amount: booking.totalPrice,
          expiresAt: new Date(
            Math.min(
              now.getTime() + PAYMENT_LINK_TTL_MS,
              booking.paymentDueAt.getTime(),
            ),
          ),
        }),
      );
    });

    return {
      paymentId: payment.id,
      txnRef: payment.txnRef,
      expiresAt: payment.expiresAt,
      paymentUrl: this.vnpayService.buildPaymentUrl({
        txnRef: payment.txnRef,
        amount: payment.amount,
        orderInfo: this.i18n.t('payments.order_info', { args: { bookingId } }),
        ipAddr,
        createdAt: new Date(),
        expiresAt: payment.expiresAt,
      }),
    };
  }

  async handleIpn(query: VnpayParams): Promise<IpnResponse> {
    try {
      if (!this.vnpayService.verify(query)) {
        return IPN_RESPONSES.invalidSignature;
      }
      return await this.dataSource.transaction(async (manager) => {
        const payment = await manager.findOne(Payment, {
          where: { txnRef: query.vnp_TxnRef },
          select: PAYMENT_IPN_SELECT,
          lock: { mode: 'pessimistic_write' },
        });
        if (!payment) return IPN_RESPONSES.notFound;
        if (
          query.vnp_Amount !== this.vnpayService.toVnpayAmount(payment.amount)
        ) {
          return IPN_RESPONSES.invalidAmount;
        }
        if (!IPN_PROCESSABLE_STATUSES.includes(payment.status)) {
          return IPN_RESPONSES.alreadyConfirmed;
        }

        const result = {
          bankCode: query.vnp_BankCode || null,
          transactionNo: query.vnp_TransactionNo || null,
          responseCode: query.vnp_ResponseCode || null,
        };
        if (!this.isSuccessful(query)) {
          await manager.update(Payment, payment.id, {
            ...result,
            status: PaymentStatus.FAILED,
          });
          return IPN_RESPONSES.success;
        }

        const booking = await manager.findOne(Booking, {
          where: { id: payment.bookingId },
          select: PAYMENT_BOOKING_SELECT,
          lock: { mode: 'pessimistic_write' },
        });
        const payable =
          booking?.status === BookingStatus.APPROVED &&
          booking.paymentStatus === BookingPaymentStatus.UNPAID;
        await manager.update(Payment, payment.id, {
          ...result,
          status: payable
            ? PaymentStatus.SUCCEEDED
            : PaymentStatus.NEEDS_REFUND,
          paidAt: new Date(),
        });
        if (!payable) {
          this.logger.warn(
            `Payment ${query.vnp_TxnRef} succeeded but booking #${payment.bookingId} is no longer payable, refund required`,
          );
          return IPN_RESPONSES.success;
        }

        await manager.update(Booking, payment.bookingId, {
          paymentStatus: BookingPaymentStatus.PAID,
        });
        await this.bookingNotificationService.notifyMany(
          [payment.bookingId],
          NotificationTemplate.PAYMENT_SUCCEEDED,
        );
        return IPN_RESPONSES.success;
      });
    } catch (error) {
      this.logger.error(
        `VNPay IPN for ${query.vnp_TxnRef} failed`,
        error instanceof Error ? error.stack : String(error),
      );
      return IPN_RESPONSES.unknownError;
    }
  }

  handleReturn(query: VnpayParams): PaymentReturnResult {
    return {
      success: this.vnpayService.verify(query) && this.isSuccessful(query),
      txnRef: query.vnp_TxnRef,
      responseCode: query.vnp_ResponseCode,
    };
  }

  private isSuccessful(query: VnpayParams): boolean {
    return (
      query.vnp_ResponseCode === VNPAY_SUCCESS_CODE &&
      query.vnp_TransactionStatus === VNPAY_SUCCESS_CODE
    );
  }
}
