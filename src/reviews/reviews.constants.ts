export const MIN_RATING = 1;
export const MAX_RATING = 5;

export const TOUR_REVIEW_LIST_COLUMNS = [
  'review.id',
  'review.rating',
  'review.comment',
  'review.createdAt',
  'user.id',
  'user.fullName',
];

export const ADMIN_REVIEW_LIST_COLUMNS = [
  'review.id',
  'review.tourId',
  'review.userId',
  'review.bookingId',
  'review.rating',
  'review.comment',
  'review.createdAt',
  'tour.id',
  'tour.name',
  'user.id',
  'user.email',
  'user.fullName',
];

export const REVIEW_AVATAR_SELECT = { attachableId: true, url: true } as const;
