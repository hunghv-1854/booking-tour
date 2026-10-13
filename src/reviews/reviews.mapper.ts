import { Review } from './review.entity';
import { CreatedReview, TourReviewItem } from './reviews.interface';

export function toTourReviewItem(
  review: Review,
  avatar: string | null,
): TourReviewItem {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    user: { fullName: review.user.fullName, avatar },
    createdAt: review.createdAt,
  };
}

export function toCreatedReview(review: Review): CreatedReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
