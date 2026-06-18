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

    const avatarPresignResponse = await request(app.getHttpServer())
      .get('/api/users/me/avatar-presigned-url?contentType=image%2Fwebp')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(avatarPresignResponse.body.uploadUrl).toBeTruthy();
    expect(avatarPresignResponse.body.fileKey).toContain('avatars/');

    const searchResponse = await request(app.getHttpServer())
      .get('/api/search?q=Auth&limit=5')
      .expect(200);

    expect(Array.isArray(searchResponse.body.users)).toBe(true);
    expect(Array.isArray(searchResponse.body.videos)).toBe(true);

    const feedResponse = await request(app.getHttpServer())
      .get('/api/videos/feed?limit=1')
      .expect(200);
    const videoId = feedResponse.body.data[0]?.id;

    if (videoId) {
      const rootComment = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/comments`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ content: 'Root E2E comment' })
        .expect(201);

      const childComment = await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/comments`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          content: 'Child E2E comment',
          parentId: rootComment.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/videos/${videoId}/comments`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          content: 'Nested E2E comment',
          parentId: childComment.body.id,
        })
        .expect(201);

      const repliesResponse = await request(app.getHttpServer())
        .get(`/api/comments/${rootComment.body.id}/replies?limit=100`)
        .expect(200);

      expect(repliesResponse.body.data[0].id).toBe(childComment.body.id);
      expect(repliesResponse.body.data[0].replies).toHaveLength(1);

      await request(app.getHttpServer())
        .delete(`/api/comments/${rootComment.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);
    }

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
