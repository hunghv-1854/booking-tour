import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const BLACKLIST_KEY_PREFIX = 'auth:blacklisted-jti:';
const REFRESH_TOKEN_KEY_PREFIX = 'auth:refresh-jti:';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.client.set(this.keyFor(jti), '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const value = await this.client.get(this.keyFor(jti));
    return value !== null;
  }

  async storeRefreshToken(
    jti: string,
    userId: number,
    ttlSeconds: number,
  ): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.client.set(
      this.refreshKeyFor(jti),
      String(userId),
      'EX',
      ttlSeconds,
    );
  }

  async getRefreshTokenOwner(jti: string): Promise<number | null> {
    const value = await this.client.get(this.refreshKeyFor(jti));
    return value === null ? null : Number(value);
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.client.del(this.refreshKeyFor(jti));
  }

  private keyFor(jti: string): string {
    return `${BLACKLIST_KEY_PREFIX}${jti}`;
  }

  private refreshKeyFor(jti: string): string {
    return `${REFRESH_TOKEN_KEY_PREFIX}${jti}`;
  }
}
