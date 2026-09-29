import { TourDetail, TourListItem, TourRating } from './tours.interface';
import { Tour } from './tour.entity';

export function toTourListItem(
  tour: Tour,
  thumbnail: string | null,
  rating: TourRating,
): TourListItem {
  return {
    id: tour.id,
    name: tour.name,
    slug: tour.slug,
    thumbnail,
    price: tour.price,
    location: tour.location,
    avgRating: rating.avgRating,
  };
}

export function toTourDetail(
  tour: Tour,
  images: string[],
  rating: TourRating,
): TourDetail {
  return {
    id: tour.id,
    name: tour.name,
    slug: tour.slug,
    description: tour.description,
    price: tour.price,
    duration: tour.duration,
    location: tour.location,
    startDate: tour.startDate,
    endDate: tour.endDate,
    maxSlot: tour.maxSlot,
    availableSlot: tour.availableSlot,
    category: { id: tour.category.id, name: tour.category.name },
    images,
    itinerary: tour.itineraries.map(({ dayNumber, title, description }) => ({
      dayNumber,
      title,
      description,
    })),
    ...rating,
  };
}
