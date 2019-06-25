import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoDbService } from '../src/feature-modules/database';
import fs from 'fs';

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
      .get('/v2/recent-activity/proposals?diff=metadata')
      .expect(200)
  });

  it('Recent Activity: Expiring Proposals', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?expiring=true')
      .expect(200)
  });

  it('Recent Activity: Completed Proposals', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?completed=true')
      .expect(200)
  });

  it('Recent Activity: Proposals w/ Preview and Diff Percent', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?diff=metadata&preview=true')
      .expect(200)
  });

  it('Recent Activity: Proposals in Spanish', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/proposals?langs=es')
      .expect(200)
  });

  it('Recent Activity: Trending', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/trending')
      .expect(200)
  });

  it('Recent Activity: Trending All Time', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/trending?range=all')
      .expect(200)
  });

  it('Recent Activity: Trending English', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/trending?langs=en')
      .expect(200)
  });

  it('Recent Activity: Trending Bad language', () => {
    return request(app.getHttpServer())
      .get('/v2/recent-activity/trending?langs=tree')
      .expect(200)
  });

  it('Proposal: Basic proposal', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/1011')
        .expect(200)
  });

  it('Proposal: Multiple proposals', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/182,192,190')
        .expect(200)
  });

  it('Proposal: Multiple proposals w/ preview', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/182,192,190?preview=true')
        .expect(200)
  });

  it('Proposal: Multiple proposals w/ diff metadata', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/182,192,190?diff=metadata')
        .expect(200)
  });

  it('Proposal: Multiple proposals w/ full diff', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/182,192,190?diff=full')
        .expect(200)
  });

  it('Proposal: Multiple proposals w/ preview and full diff', () => {
    return request(app.getHttpServer())
        .get('/v2/proposal/182,192,190?diff=full&preview=true')
        .expect(200)
  });

  it('History: Get wiki history', () => {
    return request(app.getHttpServer())
        .get('/v2/history/wiki/lang_en/alex-miller')
        .expect(200)
  });

  it('History: Get wiki history w/ full diff & preview', () => {
    return request(app.getHttpServer())
        .get('/v2/history/wiki/lang_en/alex-miller?diff=full&preview=true')
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

  it('Wiki: Get wiki by slug - no cache', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/William_Legate?cache=false')
        .expect(200)
  });

  it('Wiki: Get wiki by slug with unicode', () => {
      return request(app.getHttpServer())
          .get('/v2/wiki/slug/lang_ko/%EB%B2%A0%EB%A0%88%ED%83%80_92')
          .expect(200)
  });

  it('Wiki: Get wiki by slug with unicode, method 2', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/aq%C5%9Fin-qurbanl%C4%B1')
        .expect(200)
});

  it('Wiki: Get wiki redirect', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/Polymaths')
        .expect(200)
  });

  it('Wiki: Get non-existent wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_es/jonah_kabidiman')
        .expect(404)
  });

  it('Wiki: Get wiki group', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/group/lang_en/wikipedia')
        .expect(200)
  });

  it('Wiki Json: Manaus', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/Manaus')
        .expect(200)
  });

  it('Wiki Json: 2016 Summer Olympics', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/2016_Summer_Olympics')
        .expect(200)
  });

  it('Wiki Json: Ghana', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/Ghana')
        .expect(200)
  });

  it('Wiki Json: Real Matrix', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/Real_matrix')
        .expect(200)
  });

  it('Wiki Json: Big Page: Donald Trump', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/slug/lang_en/Donald_Trump')
        .expect(200)
  });

  it('Wiki AMP HTML: Travis Moore', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/amp/lang_en/travismoore5036459')
        .expect(200)
  });

  it('Wiki AMP HTML in unicode: 베레타 92', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/amp/lang_ko/%EB%B2%A0%EB%A0%88%ED%83%80_92')
        .expect(200)
  });

  it('Wiki: Get schema by slug', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/schema/lang_en/travismoore5036459')
        .expect(200)
  });

  it('Wiki: Get schema by slug with unicode', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/schema/lang_ko/%EB%B2%A0%EB%A0%88%ED%83%80_92')
        .expect(200)
  });

  it('Wiki: Get extra info', () => {
    return request(app.getHttpServer())
        .get('/v2/wiki/extra/lang_en/travismoore5036459')
        .expect(200)
  });

  it('Wiki: Submit wiki', () => {
    const wiki = JSON.parse(fs.readFileSync('test/kedar-iyer-wiki.json', 'utf8'));
    wiki.metadata.find(m => m.key == "last_modified").value = (new Date).toISOString();
    return request(app.getHttpServer())
        .post('/v2/wiki')
        .send(wiki)
        .expect(201)
  });

  it('Wiki: Failed Wiki Submission: non-null ipfs hash', () => {
    const wiki = JSON.parse(fs.readFileSync('test/kedar-iyer-wiki.json', 'utf8'));
    wiki.ipfs_hash = "Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd";
    return request(app.getHttpServer())
        .post('/v2/wiki')
        .send(wiki)
        .expect(400)
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
        .post('/v2/search/title/')
        .send({
          query: "Travis Moore",
        })
        .expect(201)
  });

  it('Search: No Results', () => {
    return request(app.getHttpServer())
        .post('/v2/search/title/')
        .send({
          query: "Coloossed",
        })
        .set('Accept', 'application/json')
        .expect(201)
  });

  it('Search: English only', () => {
    return request(app.getHttpServer())
        .post('/v2/search/title/')
        .send({
          query: "Travis",
          langs: ['en']
        })
        .set('Accept', 'application/json')
        .expect(201)
  });

  it('Search Schema: Birth and Person', () => {
    return request(app.getHttpServer())
        .get('/v2/search/schema-by-type/birth?page_type=Person')
        .expect(200)
  });
  
  it('Diff: Proposal diff', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/190')
        .expect(200)
  });

  it('Diff: Proposal diffs', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/182,192,190')
        .expect(200)
  });

  it('Diff: Non-existent proposal', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/proposal/7989239023')
        .expect(404)
  });

  it('Diff: Hash diff', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/hash/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd/QmTEYQdsqrjSP9PNLbtZVzSeAm9XSircTgL6bB2LGoAB6v')
        .expect(200)
  });

  it('Diff: Spam hashes', () => {
    return request(app.getHttpServer())
        .get('/v2/diff/hash/null/Qmasfdsa')
        .expect(200)
  });

  it('Preview: By Hash', () => {
    return request(app.getHttpServer())
        .get('/v2/preview/hash/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd,QmTbt2AFYFbyF1cae7AuXiYfEWEsDVgnth2Z5X4YBceu6z')
        .expect(200)
  });

  it('Preview: By Slug - Scraped Wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/preview/slug/lang_en/wikipedia')
        .expect(200)
  });

  it('Preview: By Slug - Original Wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/preview/slug/lang_en/mvgenvideos')
        .expect(200)
  });

  it('Preview: Multiple By Slug', () => {
    return request(app.getHttpServer())
        .post('/v2/preview/slugs')
        .send([
            { "lang_code": "en", "slug": "Donald_Trump" },
            { "lang_code": "en", "slug": "nusrat-jahan-rafi" },
            { "lang_code": "en", "slug": "kill-bill-the-rapper" },
            { "lang_code": "en", "slug": "wikipedia" },
            { "lang_code": "en", "slug": "mvgenvideos" },
            { "lang_code": "en", "slug": "William_Legate" },
            { "lang_code": "en", "slug": "Donald_Trump" },
            { "lang_code": "en", "slug": "cardi-b" },
            { "lang_code": "ko", "slug": "%EB%B2%A0%EB%A0%88%ED%83%80_92" },
            { "lang_code": "en", "slug": "kamala-harris" }
        ])
        .expect(201)
  });

  it('User: Stakes', () => {
    return request(app.getHttpServer())
        .get('/v2/user/eptestusersa/stakes')
        .expect(200)
  });

  it('User: Rewards', () => {
    return request(app.getHttpServer())
        .get('/v2/user/eptestusersf/rewards')
        .expect(200)
  });

  it('User: Activity', () => {
    return request(app.getHttpServer())
        .get('/v2/user/eptestusersf/activity')
        .expect(200)
  });

  it('Cache: Wiki', () => {
    return request(app.getHttpServer())
        .get('/v2/cache/wiki/Qma8CesWPfYnM5JyZ4E5qtrSPUfUVRu3EmrqmE1oCAdfEd')
        .expect(200)
  });

  it('Stat: Site Usage', () => {
    return request(app.getHttpServer())
        .get('/v2/stat/site-usage')
        .expect(200)
  });

  it('Stat: Editor Leaderboard', () => {
    return request(app.getHttpServer())
        .get('/v2/stat/editor-leaderboard')
        .expect(200)
  });

  it('Stat: Editor Leaderboard - All Time', () => {
    return request(app.getHttpServer())
        .get('/v2/stat/editor-leaderboard?period=all-time')
        .expect(200)
  });

  it('Stat: Editor Leaderboard - Since long time', () => {
    return request(app.getHttpServer())
        .get('/v2/stat/editor-leaderboard?since=1573243')
        .expect(200)
  });

  it('Contact Us: Submit', () => {
    return request(app.getHttpServer())
        .post('/v2/contact-us')
        .send({
          contactdate: "2099-09-15T15:53:00",
          contacttext: "SAMPLE BODY TEXT",
          contactemail: "testemail@test.com",
          contactname: "Tester McTester",
          contactsubject: "BACKEND API TEST",
          contacttype: "Report Abuse",
          contactip: "66.66.66.66",
          contactuseragent: "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0 Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0."
        })
        .set('Accept', 'application/json')
        .expect(201)
  });

  it('Sitemap: Recent', () => {
    return request(app.getHttpServer())
        .get('/v2/sitemap/recent/en')
        .expect(200)
  });

});
