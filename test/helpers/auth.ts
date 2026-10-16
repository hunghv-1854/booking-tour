import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';

export const FIXTURE_PASSWORD = 'Passw0rd!';

export async function loginAs(
  app: INestApplication,
  email: string,
): Promise<string> {
  const response = await request(app.getHttpServer() as Server)
    .post('/api/auth/login')
    .send({ email, password: FIXTURE_PASSWORD })
    .expect(200);
  const { accessToken } = response.body as { accessToken: string };
  return `Token ${accessToken}`;
}
