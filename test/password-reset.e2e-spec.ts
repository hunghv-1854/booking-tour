import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AccountNotificationTemplate } from '../src/notifications/account-notification-template.enum';
import { UserStatus } from '../src/users/user-status.enum';
import { User } from '../src/users/user.entity';
import {
  BookingFixtures,
  seedBookingFixtures,
} from './fixtures/booking.fixtures';
import { FIXTURE_PASSWORD } from './helpers/auth';
import { truncateAllTables } from './helpers/database';
import { createTestApp, TestApp } from './helpers/test-app';

describe('Password reset (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let dataSource: DataSource;
  let fixtures: BookingFixtures;
  const NEW_PASSWORD = 'N3w-Str0ng-Pass';

  const http = () => request(app.getHttpServer() as Server);
  const forgot = (email: string) =>
    http().post('/api/auth/forgot-password').send({ email });
  const lastToken = () => {
    const calls = testApp.accountNotifications.sendPasswordToken.mock.calls as [
      number,
      AccountNotificationTemplate,
      string,
      number,
    ][];
    return calls[calls.length - 1][2];
  };
  const login = (email: string, password: string) =>
    http().post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
  });

  beforeEach(async () => {
    fixtures = await seedBookingFixtures(dataSource);
  });

  afterEach(async () => {
    await truncateAllTables(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('resets the password with the emailed token, only once', async () => {
    await forgot(fixtures.alice.email).expect(200).expect({
      message: 'If the email exists, a password reset link has been sent',
    });
    expect(testApp.accountNotifications.sendPasswordToken).toHaveBeenCalledWith(
      fixtures.alice.id,
      AccountNotificationTemplate.PASSWORD_RESET,
      expect.any(String),
      1800,
    );
    const token = lastToken();

    await http()
      .post('/api/auth/reset-password?lang=vi')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(200)
      .expect({ message: 'Đã đặt lại mật khẩu' });

    await login(fixtures.alice.email, FIXTURE_PASSWORD).expect(401);
    await login(fixtures.alice.email, NEW_PASSWORD).expect(200);

    const reused = await http()
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'An0ther-Pass' })
      .expect(422);
    expect(reused.body).toEqual({
      errors: { token: ['is invalid or has expired'] },
    });
  });

  it('answers the same way for an unknown email and sends nothing', async () => {
    await forgot('nobody@e2e.test').expect(200).expect({
      message: 'If the email exists, a password reset link has been sent',
    });
    expect(
      testApp.accountNotifications.sendPasswordToken,
    ).not.toHaveBeenCalled();
  });

  it('does not send a reset email to a locked account', async () => {
    await dataSource
      .getRepository(User)
      .update(fixtures.bob.id, { status: UserStatus.LOCKED });

    await forgot(fixtures.bob.email).expect(200);
    expect(
      testApp.accountNotifications.sendPasswordToken,
    ).not.toHaveBeenCalled();
  });

  it('rejects an unknown token and validates the new password', async () => {
    await http()
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', newPassword: NEW_PASSWORD })
      .expect(422);

    const response = await http()
      .post('/api/auth/reset-password')
      .send({ token: '', newPassword: '123' })
      .expect(422);
    expect(Object.keys(response.body.errors)).toEqual(
      expect.arrayContaining(['token', 'newPassword']),
    );
  });

  it('lets a logged-in user change the password', async () => {
    const loginResponse = await login(fixtures.alice.email, FIXTURE_PASSWORD);
    const { accessToken } = loginResponse.body as { accessToken: string };

    await http()
      .patch('/api/auth/password')
      .set('Authorization', `Token ${accessToken}`)
      .send({ currentPassword: 'wrong', newPassword: NEW_PASSWORD })
      .expect(422);
    await http()
      .patch('/api/auth/password')
      .set('Authorization', `Token ${accessToken}`)
      .send({ currentPassword: FIXTURE_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(200);

    await login(fixtures.alice.email, NEW_PASSWORD).expect(200);
  });
});
