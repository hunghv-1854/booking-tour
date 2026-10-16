import { I18nService } from 'nestjs-i18n';

export function createI18nMock(): jest.Mocked<Pick<I18nService, 't'>> {
  return { t: jest.fn((key: string) => key) } as jest.Mocked<
    Pick<I18nService, 't'>
  >;
}
