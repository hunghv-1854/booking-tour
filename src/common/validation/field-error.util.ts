import { UnprocessableEntityException } from '@nestjs/common';

export function fieldError(
  field: string,
  message: string,
): UnprocessableEntityException {
  return new UnprocessableEntityException({ errors: { [field]: [message] } });
}
