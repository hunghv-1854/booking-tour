import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { decimalColumnTransformer } from '../common/transformers/decimal-column.transformer';
import { PaymentStatus } from './payment-status.enum';

@Entity('payments')
@Index(['status', 'expiresAt'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'booking_id' })
  bookingId: number;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Index({ unique: true })
  @Column({ name: 'txn_ref', length: 64 })
  txnRef: string;

  @Column({ type: 'decimal', transformer: decimalColumnTransformer })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'bank_code', nullable: true, type: 'varchar', length: 20 })
  bankCode: string | null;

  @Column({
    name: 'transaction_no',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  transactionNo: string | null;

  @Column({
    name: 'response_code',
    nullable: true,
    type: 'varchar',
    length: 2,
  })
  responseCode: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'paid_at', nullable: true, type: 'timestamptz' })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
