import { crawl } from './crawler.js';

export default class Cache {

  constructor(collection) {
    this._collection = collection;
    this._collection.ensureIndex({ token: 1, url: 1 })
      .catch((error) => {
        console.log(
          'error: could not create index on cache collection. - ',
          error.message
        );
      });
  }

  async retrievePage(config, url) {
    console.log('*** ghostwriter:', 'loading url', url);
    // retrieve page from cache if it exists
    let page = await this._collection.findOne({ token: config.token, url });
    // crawl page if required
    if(!page) {
      page = {
        token: config.token,
        url: url,
        timestamp: Date.now(),
        content: await crawl(config, url)
      };
      await this._collection.insertOne(page);
    }
    // update page in background if required
    else if((page.timestamp + config.refreshRate) < Date.now()) {
      console.log('*** ghostwriter:', 'background crawling url', url);
      crawl(config, url)
        .then((content) => {
          page.timestamp = Date.now();
          page.content = content;
          return this._collection.updateOne({ _id: page._id }, page);
        })
        .catch((error) => {
          console.log('*** ghostwriter:', 'background crawling failed', url);
        });
    }
    // done
    return page;
  }

  async clear(config) {
    // remove all cached pages of token
    await this._collection.remove({ token: config.token });
  }
};
