import { BookingStatus } from '../bookings/booking-status.enum';

export interface BookingStatusChangedJob {
  bookingId: number;
  status: BookingStatus;
  lang: string;
}
