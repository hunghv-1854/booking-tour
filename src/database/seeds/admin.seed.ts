import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PasswordResetService } from '../../auth/password-reset.service';
import { generateResetToken, hashPassword } from '../../auth/password.util';
import { isUniqueViolation } from '../../common/postgres-error.util';
import { UserRole } from '../../users/user-role.enum';
import { UsersService } from '../../users/users.service';

const logger = new Logger('AdminSeed');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const email = app.get(ConfigService).getOrThrow<string>('SEED_ADMIN_EMAIL');
    const usersService = app.get(UsersService);

    if (await usersService.existsByEmail(email)) {
      logger.log(`Admin user already exists, skip seeding: ${email}`);
      return;
    }

    try {
      const admin = await usersService.create({
        email,
        password: await hashPassword(generateResetToken()),
        fullName: 'Admin',
        role: UserRole.ADMIN,
      });
      await app.get(PasswordResetService).sendAccountSetup(admin.id);
      logger.log(`Seeded admin user and sent account setup email: ${email}`);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      logger.log(`Admin user was seeded concurrently, skip: ${email}`);
    }
  } finally {
    await app.close();
  }
}

void bootstrap();
