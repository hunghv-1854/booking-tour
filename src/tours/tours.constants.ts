import { TourSortBy } from './tour-sort-by.enum';
import { TourRating } from './tours.interface';

export const TOUR_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  location: true,
} as const;

export const TOUR_SEARCH_SELECT = {
  ...TOUR_LIST_SELECT,
  startDate: true,
  endDate: true,
} as const;

export const ADMIN_TOUR_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  price: true,
  duration: true,
  location: true,
  startDate: true,
  endDate: true,
  maxSlot: true,
  availableSlot: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const TOUR_DETAIL_SELECT = {
  ...ADMIN_TOUR_SELECT,
  description: true,
  category: { id: true, name: true },
  itineraries: { id: true, dayNumber: true, title: true, description: true },
} as const;

export const TOUR_UPDATE_CHECK_SELECT = {
  id: true,
  categoryId: true,
  slug: true,
  duration: true,
  startDate: true,
  endDate: true,
  maxSlot: true,
  availableSlot: true,
} as const;

export const TOUR_SORT_ORDER: Record<
  TourSortBy,
  { column: string; direction: 'ASC' | 'DESC' }
> = {
  [TourSortBy.NEWEST]: { column: 'tour.createdAt', direction: 'DESC' },
  [TourSortBy.PRICE_ASC]: { column: 'tour.price', direction: 'ASC' },
  [TourSortBy.PRICE_DESC]: { column: 'tour.price', direction: 'DESC' },
};

export const RATING_DECIMAL_PLACES = 1;

export const EMPTY_RATING: TourRating = { avgRating: null, reviewCount: 0 };
