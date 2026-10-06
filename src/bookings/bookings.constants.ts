import { BookingStatus } from './booking-status.enum';

export const CHILD_PRICE_RATE = 0.5;

export const BOOKING_SELECT = {
  id: true,
  tourId: true,
  startDate: true,
  numberOfAdults: true,
  numberOfChildren: true,
  totalPrice: true,
  status: true,
  note: true,
  rejectReason: true,
  createdAt: true,
  updatedAt: true,
  tour: { id: true, name: true, slug: true },
} as const;

export const ADMIN_BOOKING_SELECT = {
  ...BOOKING_SELECT,
  userId: true,
  user: { id: true, email: true, fullName: true },
} as const;

export const BOOKING_TOUR_CHECK_SELECT = {
  id: true,
  price: true,
  duration: true,
  startDate: true,
  endDate: true,
} as const;

export const BOOKING_TOUR_SLOT_SELECT = {
  id: true,
  availableSlot: true,
} as const;

export const BOOKING_TRANSITION_SELECT = {
  id: true,
  userId: true,
  tourId: true,
  status: true,
  numberOfAdults: true,
  numberOfChildren: true,
} as const;

export const SLOT_RELEASING_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.REJECTED,
];

export const BOOKING_LIST_COLUMNS = [
  'booking.id',
  'booking.startDate',
  'booking.numberOfAdults',
  'booking.numberOfChildren',
  'booking.totalPrice',
  'booking.status',
  'booking.createdAt',
  'tour.id',
  'tour.name',
  'tour.slug',
];

export const ADMIN_BOOKING_LIST_COLUMNS = [
  ...BOOKING_LIST_COLUMNS,
  'booking.userId',
  'user.id',
  'user.email',
  'user.fullName',
];

export const ADMIN_BOOKING_KEYWORD_COLUMNS = ['tour.name', 'user.email'];
