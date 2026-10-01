import { BookingStatus } from './booking-status.enum';

export interface BookingStatusChange {
  id: number;
  status: BookingStatus;
}

export interface BookingTransitionOptions {
  ownerId?: number;
  rejectReason?: string;
}
