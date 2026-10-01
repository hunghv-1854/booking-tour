import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { decimalColumnTransformer } from '../common/transformers/decimal-column.transformer';
import { TourItinerary } from './tour-itinerary.entity';

@Entity('tours')
@Index(['startDate', 'endDate'])
export class Tour {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({ type: 'decimal', transformer: decimalColumnTransformer })
  price: number;

  @Column()
  duration: number;

  @Index()
  @Column()
  location: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'max_slot' })
  maxSlot: number;

  @Column({ name: 'available_slot' })
  availableSlot: number;

  @OneToMany(() => TourItinerary, (itinerary) => itinerary.tour)
  itineraries: TourItinerary[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
