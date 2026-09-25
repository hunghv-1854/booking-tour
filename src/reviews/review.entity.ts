import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Tour } from '../tours/tour.entity';
import { User } from '../users/user.entity';

@Entity('reviews')
export class Review {
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

  @Column({ name: 'booking_id', nullable: true, unique: true })
  bookingId: number | null;

  @OneToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking | null;

  @Column()
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
