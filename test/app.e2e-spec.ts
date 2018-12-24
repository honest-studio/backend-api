import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoDbService } from '../src/feature-modules/database';

describe('Backend API', () => {
  let app: INestApplication;
  let mongoDbService: MongoDbService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const mongoDbService = app.get('MongoDbService');
    await mongoDbService.connect();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Recent Activity: All', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/all')
      .expect(200)
      .expect(response => response.body.length == 10)
  });

  it('Recent Activity: All w/ offset', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/all?offset=100')
      .expect(200)
  });

  it('Recent Activity: All w/ limit', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/all?limit=20')
      .expect(response => response.body.length == 20)
      .expect(200)
  });

  it('Recent Activity: Proposals', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/proposals')
      .expect(200)
  });

  // This currently takes 1 min on average to process
  // so it has been commented out for now. It needs to 
  // be optimized so it works in a reasonable time
  //it('Recent Activity: Proposals w/ Preview', () => {
  //  return request(app.getHttpServer())
  //    .get('/v1/recent-activity/proposals?preview=true')
  //    .expect(200)
  //});

  it('Recent Activity: Wikis', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/wikis')
      .expect(200)
  });

  it('Recent Activity: Results', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/results')
      .expect(200)
  });

  it('Recent Activity: Votes', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/votes')
      .expect(200)
  });

  it('Proposal: Basic proposal', () => {
    return request(app.getHttpServer())
        .get('/v1/proposal/QmR3BxbUGf3u9qCLZSZxCrUPHQ6AoyLhLq8GymzTn4cFfh')
        .expect(200)
  });

  it('Proposal: Proposal votes', () => {
    return request(app.getHttpServer())
        .get('/v1/proposal/QmR3BxbUGf3u9qCLZSZxCrUPHQ6AoyLhLq8GymzTn4cFfh/votes')
        .expect(200)
  });

  it('Proposal: Proposal result', () => {
    return request(app.getHttpServer())
        .get('/v1/proposal/QmR3BxbUGf3u9qCLZSZxCrUPHQ6AoyLhLq8GymzTn4cFfh/result')
        .expect(200)
  });

  it('Wiki: Get wiki', () => {
    return request(app.getHttpServer())
        .get('/v1/wiki/QmR3BxbUGf3u9qCLZSZxCrUPHQ6AoyLhLq8GymzTn4cFfh')
        .expect(200)
  });

  it('Chain: Get Info', () => {
    return request(app.getHttpServer())
        .get('/v1/chain/get_info')
        .expect(200)
  });
});
