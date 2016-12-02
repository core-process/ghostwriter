import { crawl } from './crawler.js';

let cache = { };

export async function retrieve(url, config) {
  // load from cache
  console.log('*** ghostwriter:', 'loading url', url);
  if(typeof cache[url] !== 'undefined') {
    // trigger cachin in background
    if(cache[url].expiration < Date.now()) {
      console.log('*** ghostwriter:', 'background crawling url', url);
      crawl(url, config)
        .then((content) => {
          cache[url] = {
            content,
            expiration: config.refreshRate + Date.now()
          }
        })
        .catch((error) => {
          console.log('*** ghostwriter:', 'background crawling failed', url);
        });
    }
    return cache[url];
  }
  // crawl and store to cache
  return (cache[url] = {
    content: await crawl(url, config),
    expiration: config.refreshRate + Date.now()
  });
}

export function clear() {
  cache = { };
}
