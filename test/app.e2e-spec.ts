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
      .get('/v2/recent-activity/all')
      .expect(200)
      .expect(response => response.body.length == 10)
  });

  it('Recent Activity: All w/ offset', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/all?offset=100')
      .expect(200)
  });

  it('Recent Activity: All w/ limit', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/all?limit=20')
      .expect(response => response.body.length == 20)
      .expect(200)
  });

  it('Recent Activity: Proposals', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals')
      .expect(200)
  });

  it('Recent Activity: Proposals w/ Preview', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?preview=true')
      .expect(200)
  });

  it('Recent Activity: Proposals w/ Diff Percent', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?diff_percent=true')
      .expect(200)
  });

  it('Recent Activity: Expiring Proposals', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?expiring=true')
      .expect(200)
  });

  it('Recent Activity: Proposals w/ Preview and Diff Percent', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?diff_percent=true&preview=true')
      .expect(200)
  });

  it('Recent Activity: Wikis', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/wikis')
      .expect(200)
  });

  it('Recent Activity: Results', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/results')
      .expect(200)
  });

  it('Recent Activity: Votes', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/votes')
      .expect(200)
  });

  it('Proposal: Basic proposal', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/50')
        .expect(200)
  });

  it('Proposal: Multiple proposals', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/50,51,52,12')
        .expect(200)
  });

  it('Wiki: Get history', () => {
    return request(app.getHttpServer())
        .get('/v2/history/wiki/32')
        .expect(200)
  });

  it('Wiki: Get wiki by hash', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/hash/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });

  it('Wiki: Get wikis by hash', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/hash/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd,QmTbt2AFYFbyF1cae7AuXiYfEWEsDVgnth2Z5X4YBceu6z')
        .expect(200)
  });

  it('Wiki: Get wiki by title', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/title/William_Legate')
        .expect(200)
  });

  it('Wiki: Get wiki by id', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/id/1000000000')
        .expect(200)
  });

  it('Wiki: Get non-existent wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfPc')
        .expect(404)
  });

  it('Wiki: Submit article', () => {
    return request(app.getHttpServer())
        .post('/v2/wiki')
        .set('Content-type', 'text/html')
        .send(`<!DOCTYPE html><html>Hi I'm a wiki</html>`)
        .expect(201)
        .expect({
            ipfs_hash: "QmY8v3eMGG4tWBjgDgMnYDcbVnWx9ikMgxDurSeKRjLRMB"
        })
  });

  it('Chain: Get Info', () => {
    return request(app.getHttpServer())
        .get('/v2/chain/get_info')
        .expect(200)
  });

  it('Chain: Get ABI', () => {
    return request(app.getHttpServer())
        .post('/v2/chain/get_abi')
        .send({ account_name: "everipediaiq" })
        .expect(201)
  });

  it('Search: Title', () => {
    return request(app.getHttpServer())
        .get('/v2/search/title/Travis%20Moore')
        .expect(200)
  });
  
  it('Diff: Proposal diff', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/50')
        .expect(200)
  });

  it('Diff: Proposal diffs', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/34,52,50')
        .expect(200)
  });

  it('Diff: Non-existent proposal', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/7989239023')
        .expect(404)
  });

  it('Diff: Wiki diff', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd/QmTEYQdsqrjSP9PNLbtZVzSeAm9XSircTgL6bB2LGoAB6v')
        .expect(200)
  });

  it('Diff: History diff', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/history/16')
        .expect(200)
  });

  it('Preview: Wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/preview/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });

  it('Preview: Wikis', () => {
    return request(app.getHttpServer())
        .get('/v2/preview/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd,QmTbt2AFYFbyF1cae7AuXiYfEWEsDVgnth2Z5X4YBceu6z')
        .expect(200)
  });

  it('Cache: Wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/cache/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });
});
