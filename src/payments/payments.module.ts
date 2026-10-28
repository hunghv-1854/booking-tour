import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingPaymentExpirationTask } from './booking-payment-expiration.task';
import { PaymentExpirationTask } from './payment-expiration.task';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    VnpayService,
    PaymentExpirationTask,
    BookingPaymentExpirationTask,
  ],
})
export class PaymentsModule {}
