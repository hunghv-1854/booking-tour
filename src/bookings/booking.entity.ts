import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tour } from '../tours/tour.entity';
import { User } from '../users/user.entity';
import { BookingStatus } from './booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tour_id' })
  tourId: number;

  @ManyToOne(() => Tour)
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'number_of_adults' })
  numberOfAdults: number;

  @Column({ name: 'number_of_children', default: 0 })
  numberOfChildren: number;

  @Column({ name: 'total_price', type: 'decimal' })
  totalPrice: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @Column({ name: 'reject_reason', nullable: true, type: 'text' })
  rejectReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
