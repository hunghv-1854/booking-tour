import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { PASSWORD_SALT_ROUNDS } from '../../auth/auth.constants';
import { UserRole } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';

const logger = new Logger('AdminSeed');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const configService = app.get(ConfigService);
    const usersService = app.get(UsersService);

    const email = configService.getOrThrow<string>('SEED_ADMIN_EMAIL');
    const password = configService.getOrThrow<string>('SEED_ADMIN_PASSWORD');

    if (await usersService.existsByEmail(email)) {
      logger.log(`Admin user already exists, skip seeding: ${email}`);
      return;
    }

    await usersService.create({
      email,
      password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
      fullName: 'Admin',
      role: UserRole.ADMIN,
    });
    logger.log(`Seeded admin user: ${email}`);
  } finally {
    await app.close();
  }
}

void bootstrap();
