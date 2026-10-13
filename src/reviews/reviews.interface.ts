export interface TourReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  user: { fullName: string; avatar: string | null };
  createdAt: Date;
}

export interface CreatedReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
}
