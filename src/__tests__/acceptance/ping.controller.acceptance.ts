import {Client, expect} from '@loopback/testlab';
import {ScrapperAppApplication} from '../..';
import {setupApplication} from './test-helper';

describe('ScrappingController', () => {
  let app: ScrapperAppApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('invokes GET /v1/scraper-app/scrap/now', async () => {
    const res = await client.get('/v1/scraper-app/scrap/now?msg=world').expect(200);
    expect(res.body).to.containEql({greeting: 'Hello from LoopBack'});
  });
});
