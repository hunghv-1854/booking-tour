import { ConfigService } from '@nestjs/config';
import { RedisConnectionOptions } from './redis.interface';

export function redisConnectionOptions(
  configService: ConfigService,
): RedisConnectionOptions {
  return {
    host: configService.getOrThrow<string>('REDIS_HOST'),
    port: Number(configService.getOrThrow<string>('REDIS_PORT')),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    family: 0,
  };
}
