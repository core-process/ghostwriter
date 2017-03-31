import { crawl } from './crawler.js';
import adjustUrlBase from './adjust-url-base.js';

export default class Cache {

  constructor(pageCollection) {
    this._pageCollection = pageCollection;
    this._pageCollection.ensureIndex(
      { token: 1, url: 1, target: 1 },
      { unique: true, dropDups: true, w: 'majority' }
    )
      .catch((error) => {
        console.log(
          'error: could not create index on cache pageCollection. - ',
          error.message
        );
      });
  }

  async retrievePage(config, url, target, backgroundRefresh, allowEmpty) {
    // rebase url
    url = adjustUrlBase(url, config.appUrl);
    console.log('*** ghostwriter:', 'loading url', url, target);
    // crawl and cache routines
    const crawlCache = async () => {
      const result = await crawl(config, url, target);
      const page = {
        token: config.token,
        url: url,
        target: target,
        timestamp: Date.now(),
        version: config.version,
        content: result.source,
        status: result.status,
      };
      await this._pageCollection.updateOne(
        { token, url, target },
        page,
        { upsert: true, w: 'majority' }
      );
      return page;
    };
    const fCrawlCache = async () => {
      console.log('*** ghostwriter:', 'foreground crawling url', url, target);
      try {
        return await crawlCache();
      }
      catch(error) {
        console.log('*** ghostwriter:', 'background crawling failed', url, target);
        throw error;
      }
    };
    const bCrawlCache = () => {
      console.log('*** ghostwriter:', 'background crawling url', url, target);
      crawlCache()
        .catch((error) => {
          console.log('*** ghostwriter:', 'background crawling failed', url, target);
        });
    };
    // retrieve page from cache if it exists
    let page = await this._pageCollection.findOne(
      { token: config.token, url, target }
    );
    // crawl page first time if required
    if(!page || page.version != config.version) {
      if(allowEmpty) {
        bCrawlCache();
        page = null;
      }
      else {
        page = await fCrawlCache();
      }
    }
    // re-crawl page if required
    else
    if((page.timestamp + (config.refreshCycle * 60 * 60 * 1000)) < Date.now()) {
      if(backgroundRefresh) {
        bCrawlCache();
      }
      else {
        page = await fCrawlCache();
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
