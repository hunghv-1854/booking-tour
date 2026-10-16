import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { BookingNotificationService } from '../../src/notifications/booking-notification.service';

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  notifications: { notifyStatusChanged: jest.Mock };
}

export async function createTestApp(): Promise<TestApp> {
  const notifications = { notifyStatusChanged: jest.fn() };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(BookingNotificationService)
    .useValue(notifications)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, dataSource: app.get(DataSource), notifications };
}
