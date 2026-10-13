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

export const TOUR_IMAGES_BODY_SCHEMA = {
  type: 'object',
  properties: {
    images: { type: 'array', items: { type: 'string', format: 'binary' } },
  },
};

export const CREATE_TOUR_FORM_SCHEMA = {
  type: 'object',
  required: [
    'categoryId',
    'name',
    'slug',
    'description',
    'price',
    'duration',
    'location',
    'startDate',
    'endDate',
    'maxSlot',
  ],
  properties: {
    categoryId: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Tour Phú Quốc 4N3Đ' },
    slug: { type: 'string', example: 'tour-phu-quoc-4n3d' },
    description: { type: 'string', example: 'Khám phá đảo ngọc Phú Quốc' },
    price: { type: 'number', example: 4500000 },
    duration: { type: 'integer', example: 4 },
    location: { type: 'string', example: 'Phú Quốc' },
    startDate: { type: 'string', format: 'date', example: '2026-11-01' },
    endDate: { type: 'string', format: 'date', example: '2026-11-04' },
    maxSlot: { type: 'integer', example: 15 },
    itineraries: {
      type: 'string',
      description: 'JSON array',
      example:
        '[{"dayNumber":1,"title":"Bay ra đảo"},{"dayNumber":2,"title":"Nam đảo"}]',
    },
    images: { type: 'array', items: { type: 'string', format: 'binary' } },
  },
};
