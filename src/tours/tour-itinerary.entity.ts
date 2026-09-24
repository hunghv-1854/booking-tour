import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tour } from './tour.entity';

@Entity('tour_itineraries')
export class TourItinerary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tour_id' })
  tourId: number;

  @ManyToOne(() => Tour, (tour) => tour.itineraries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column({ name: 'day_number' })
  dayNumber: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;
}
