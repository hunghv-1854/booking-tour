import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { BookingStatus } from '../../src/bookings/booking-status.enum';
import { Booking } from '../../src/bookings/booking.entity';
import { addDays, today } from '../../src/bookings/booking.util';
import { Category } from '../../src/categories/category.entity';
import { Tour } from '../../src/tours/tour.entity';
import { UserRole } from '../../src/users/user-role.enum';
import { User } from '../../src/users/user.entity';
import { FIXTURE_PASSWORD } from '../helpers/auth';

export interface BookingFixtures {
  admin: User;
  alice: User;
  bob: User;
  upcomingTour: Tour;
  ongoingTour: Tour;
  fullTour: Tour;
  alicePending: Booking;
  aliceApproved: Booking;
  bobPending: Booking;
}

export async function seedBookingFixtures(
  dataSource: DataSource,
): Promise<BookingFixtures> {
  const password = await bcrypt.hash(FIXTURE_PASSWORD, 4);
  const users = dataSource.getRepository(User);
  const [admin, alice, bob] = await users.save([
    {
      email: 'admin@e2e.test',
      fullName: 'Admin',
      password,
      role: UserRole.ADMIN,
    },
    { email: 'alice@e2e.test', fullName: 'Alice', password },
    { email: 'bob@e2e.test', fullName: 'Bob', password },
  ]);

  const category = await dataSource
    .getRepository(Category)
    .save({ name: 'Biển đảo', slug: 'bien-dao' });

  const tours = dataSource.getRepository(Tour);
  const baseTour = {
    categoryId: category.id,
    description: 'd',
    price: 1_000_000,
    duration: 3,
    location: 'Phú Quốc',
  };
  const [upcomingTour, ongoingTour, fullTour] = await tours.save([
    {
      ...baseTour,
      name: 'Tour Phú Quốc',
      slug: 'tour-phu-quoc',
      startDate: addDays(today(), 10),
      endDate: addDays(today(), 20),
      maxSlot: 10,
      availableSlot: 7,
    },
    {
      ...baseTour,
      name: 'Tour Đà Lạt',
      slug: 'tour-da-lat',
      location: 'Đà Lạt',
      startDate: addDays(today(), -5),
      endDate: addDays(today(), 10),
      maxSlot: 10,
      availableSlot: 10,
    },
    {
      ...baseTour,
      name: 'Tour Hết Chỗ',
      slug: 'tour-het-cho',
      startDate: addDays(today(), 10),
      endDate: addDays(today(), 20),
      maxSlot: 2,
      availableSlot: 1,
    },
  ]);

  const bookings = dataSource.getRepository(Booking);
  const baseBooking = {
    tourId: upcomingTour.id,
    startDate: addDays(today(), 11),
    numberOfAdults: 1,
    numberOfChildren: 0,
    totalPrice: 1_000_000,
  };
  const [alicePending, aliceApproved, bobPending] = await bookings.save([
    {
      ...baseBooking,
      userId: alice.id,
      numberOfAdults: 2,
      numberOfChildren: 1,
      totalPrice: 2_500_000,
    },
    {
      ...baseBooking,
      userId: alice.id,
      tourId: ongoingTour.id,
      status: BookingStatus.APPROVED,
    },
    { ...baseBooking, userId: bob.id },
  ]);

  return {
    admin,
    alice,
    bob,
    upcomingTour,
    ongoingTour,
    fullTour,
    alicePending,
    aliceApproved,
    bobPending,
  };
}
