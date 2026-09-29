import { UnprocessableEntityException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';

const I18N_MESSAGE_PATTERN = /^([\w.]+)\|(.*)$/;

function translateMessage(message: string, property: string): string {
  const match = I18N_MESSAGE_PATTERN.exec(message);
  if (!match) return message;

  const i18n = I18nContext.current();
  if (!i18n) return message;

  const [, key, rawArgs] = match;
  const args = JSON.parse(rawArgs) as Record<string, unknown>;
  return i18n.translate(key, { args: { property, ...args } });
}

/** e.g. `itineraries.0.title`. */
function collectErrors(
  errors: ValidationError[],
  acc: Record<string, string[]>,
  parentPath?: string,
): void {
  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    if (error.children?.length) {
      collectErrors(error.children, acc, path);
      continue;
    }
    if (error.constraints) {
      acc[path] = Object.values(error.constraints).map((message) =>
        translateMessage(message, error.property),
      );
    }
  }
}

export function validationExceptionFactory(
  errors: ValidationError[],
): UnprocessableEntityException {
  const formatted: Record<string, string[]> = {};
  collectErrors(errors, formatted);
  return new UnprocessableEntityException({ errors: formatted });
}
