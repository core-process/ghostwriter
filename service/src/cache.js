import { crawl } from './crawler.js';

export default class Cache {

  constructor(pageCollection) {
    this._pageCollection = pageCollection;
    this._pageCollection.ensureIndex(
      { token: 1, url: 1 },
      { unique: true, dropDups: true, w: 'majority' }
    )
      .catch((error) => {
        console.log(
          'error: could not create index on cache pageCollection. - ',
          error.message
        );
      });
  }

  async retrievePage(config, url, backgroundRefresh = true) {
    console.log('*** ghostwriter:', 'loading url', url);
    // retrieve page from cache if it exists
    let page = await this._pageCollection.findOne(
      { token: config.token, url }
    );
    // crawl page if required
    if(!page) {
      page = {
        token: config.token,
        url: url,
        timestamp: Date.now(),
        version: config.version,
        content: await crawl(config, url)
      };
      await this._pageCollection.updateOne(
        { token: page.token, url: page.url },
        page,
        { upsert: true, w: 'majority' }
      );
    }
    // update page in background if required
    else
    if(  (page.timestamp + config.refreshCycle) < Date.now()
      || page.version != config.version
    ) {
      if(backgroundRefresh && page.version == config.version) {
        console.log('*** ghostwriter:', 'background crawling url', url);
        crawl(config, url)
          .then((content) => {
            page.timestamp = Date.now();
            page.version = config.version;
            page.content = content;
            return this._pageCollection.updateOne(
              { token: page.token, url: page.url },
              page,
              { upsert: true, w: 'majority' }
            );
          })
          .catch((error) => {
            console.log('*** ghostwriter:', 'background crawling failed', url);
          });
      }
      else {
        console.log('*** ghostwriter:', 'foreground crawling url', url);
        const content = await crawl(config, url);
        page.timestamp = Date.now();
        page.version = config.version;
        page.content = content;
        await this._pageCollection.updateOne(
          { token: page.token, url: page.url },
          page,
          { upsert: true, w: 'majority' }
        );
      }
    }
    // done
    return page;
  }

  async clear(config) {
    // remove all cached pages of token
    await this._pageCollection.remove(
      { token: config.token },
      { w: 'majority' }
    );
  }
};
