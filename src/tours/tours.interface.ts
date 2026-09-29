export interface TourRating {
  avgRating: number | null;
  reviewCount: number;
}

export interface TourListItem {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  location: string;
  avgRating: number | null;
}

export interface TourSearchItem extends TourListItem {
  startDate: string;
  endDate: string;
}

export interface TourItineraryItem {
  dayNumber: number;
  title: string;
  description: string | null;
}

export interface TourDetail extends TourRating {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration: number;
  location: string;
  startDate: string;
  endDate: string;
  maxSlot: number;
  availableSlot: number;
  category: { id: number; name: string };
  images: string[];
  itinerary: TourItineraryItem[];
}
