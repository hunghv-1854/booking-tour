import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { runScheduledTask } from '../common/scheduling/scheduled-task.util';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { PaymentStatus } from './payment-status.enum';
import {
  PAYMENT_EXPIRATION_CRON,
  PAYMENT_IPN_GRACE_MS,
} from './payments.constants';

@Injectable()
export class PaymentExpirationTask {
  private readonly logger = new Logger(PaymentExpirationTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(PAYMENT_EXPIRATION_CRON, { timeZone: APP_TIMEZONE })
  expireStalePayments(): Promise<number[]> {
    return runScheduledTask(this.logger, 'Payment expiration', async () => {
      const [rows] = await this.dataSource.query<[{ id: number }[], number]>(
        `UPDATE payments
         SET status = $1, updated_at = now()
         WHERE status = $2 AND expires_at < now() - $3 * interval '1 millisecond'
         RETURNING id`,
        [PaymentStatus.EXPIRED, PaymentStatus.PENDING, PAYMENT_IPN_GRACE_MS],
      );
      const ids = rows.map((row) => row.id);
      this.logger.log(`Expired ${ids.length} stale payments`);
      return ids;
    });
  }
}
