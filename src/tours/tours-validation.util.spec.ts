import { UnprocessableEntityException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import {
  assertDateRange,
  assertItineraryDays,
  assertPriceRange,
} from './tours-validation.util';

describe('tours-validation.util', () => {
  const i18n = createI18nMock() as unknown as I18nService;

  it('accepts a same-day range and rejects an end before the start', () => {
    expect(() =>
      assertDateRange(i18n, '2026-11-01', '2026-11-01'),
    ).not.toThrow();
    expect(() => assertDateRange(i18n, '2026-11-02', '2026-11-01')).toThrow(
      UnprocessableEntityException,
    );
  });

  it('only checks the price range when both bounds are given', () => {
    expect(() => assertPriceRange(i18n, 10)).not.toThrow();
    expect(() => assertPriceRange(i18n, 10, 1)).toThrow(
      UnprocessableEntityException,
    );
  });

  it.each([
    ['duplicate days', [1, 1]],
    ['a day beyond the duration', [1, 4]],
  ])('rejects itineraries with %s', (_case, days) => {
    expect(() => assertItineraryDays(i18n, days, 3)).toThrow(
      UnprocessableEntityException,
    );
  });

  it('accepts unique days within the duration', () => {
    expect(() => assertItineraryDays(i18n, [2, 1, 3], 3)).not.toThrow();
  });
});
