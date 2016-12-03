import { crawl } from './crawler.js';

export default class Cache {

  constructor(dbUri) {
    this._cache = { };
  }

  async initialize() {
  }

  async retrievePage(config, url) {
    // load from cache
    console.log('*** ghostwriter:', 'loading url', url);
    if(typeof this._cache[url] !== 'undefined') {
      // trigger cachin in background
      if(this._cache[url].expiration < Date.now()) {
        console.log('*** ghostwriter:', 'background crawling url', url);
        crawl(config, url)
          .then((content) => {
            this._cache[url] = {
              content,
              expiration: config.refreshRate + Date.now()
            }
          })
          .catch((error) => {
            console.log('*** ghostwriter:', 'background crawling failed', url);
          });
      }
      return this._cache[url];
    }
    // crawl and store to cache
    return (this._cache[url] = {
      content: await crawl(config, url),
      expiration: config.refreshRate + Date.now()
    });
  }

  async clear(config) {
    this._cache = { };
  }
};
