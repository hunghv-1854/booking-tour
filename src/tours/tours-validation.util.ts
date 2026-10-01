import { I18nService } from 'nestjs-i18n';
import { fieldError } from '../common/validation/field-error.util';

export function assertDateRange(
  i18n: I18nService,
  startDate: string,
  endDate: string,
): void {
  if (endDate < startDate) {
    throw fieldError('endDate', i18n.t('tours.end_date_before_start_date'));
  }
}

export function assertPriceRange(
  i18n: I18nService,
  minPrice?: number,
  maxPrice?: number,
): void {
  if (minPrice !== undefined && maxPrice !== undefined && maxPrice < minPrice) {
    throw fieldError('maxPrice', i18n.t('tours.max_price_below_min_price'));
  }
}

export function assertItineraryDays(
  i18n: I18nService,
  dayNumbers: number[],
  duration: number,
): void {
  const valid =
    new Set(dayNumbers).size === dayNumbers.length &&
    dayNumbers.every((day) => day <= duration);
  if (!valid) {
    throw fieldError('itineraries', i18n.t('tours.invalid_day_numbers'));
  }
}
