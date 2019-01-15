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

  it('Recent Activity: Proposals w/ Preview', () => {
    return request(app.getHttpServer())
      .get('/v1/recent-activity/proposals?preview=true')
      .expect(200)
  });

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
        .get('/v1/proposal/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });

  it('Proposal: Proposal votes', () => {
    return request(app.getHttpServer())
        .get('/v1/proposal/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd/votes')
        .expect(200)
  });

  it('Proposal: Proposal result', () => {
    return request(app.getHttpServer())
        .get('/v1/proposal/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd/result')
        .expect(200)
  });

  it('Wiki: Get wiki', () => {
    return request(app.getHttpServer())
        .get('/v1/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });

  it('Wiki: Get non-existent wiki', () => {
    return request(app.getHttpServer())
        .get('/v1/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfPc')
        .expect(500)
  });

  it('Chain: Get Info', () => {
    return request(app.getHttpServer())
        .get('/v1/chain/get_info')
        .expect(200)
  });

  it('Chain: Get ABI', () => {
    return request(app.getHttpServer())
        .post('/v1/chain/get_abi')
        .send({ account_name: "everipediaiq" })
        .expect(201)
  });

  it('Search: Title', () => {
    return request(app.getHttpServer())
        .get('/v1/search/title/Travis%20Moore')
        .expect(200)
  });
});
