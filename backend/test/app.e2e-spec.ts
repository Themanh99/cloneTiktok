import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('TikTokWeb API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const authTestEmail = `auth-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'metrics', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('serves the public video feed', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/videos/feed?limit=1')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('exposes Prometheus metrics outside the API prefix', async () => {
    const response = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(response.text).toContain('tiktokweb_process_cpu');
  });

  it('supports register, immediate login, refresh rotation and logout', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: authTestEmail,
        password: 'Test1234',
        username: `auth_e2e_${Date.now()}`,
        displayName: 'Auth E2E',
      })
      .expect(201);

    expect(registerResponse.body.accessToken).toBeTruthy();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: authTestEmail, password: 'Test1234' })
      .expect(200);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.refreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(401);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: authTestEmail } });
    await app.close();
  });
});
