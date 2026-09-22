import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { extractJwtFromAuthHeader } from '../auth.constants';

/** The raw JWT string from the Authorization header, or null when absent. */
export const AuthToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return extractJwtFromAuthHeader(request);
  },
);
