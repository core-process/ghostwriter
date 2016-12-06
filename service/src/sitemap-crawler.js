import request from 'request-promise';
import * as xml2js from 'xml2js';
import { crawl } from './crawler.js';

export default class SitemapCrawler {

  constructor(sitemapCollection, config, cache) {
    this._sitemapCollection = sitemapCollection;
    this._config = config;
    this._cache = cache;
  }

  async crawlSitemaps() {
    const configs = await this._config.retrieveAll();
    for(let config of configs) {
      for(let sitemapUrl of config.sitemaps) {
        try {
          await this.crawlSitemap(config, sitemapUrl);
        }
        catch(error) {
          console.log(
            'could not retrieve sitemap', sitemapUrl,
            ' - error:', error.message || 'unknown error'
          );
        }
      }
    }
  }

  async crawlSitemap(config, sitemapUrl) {
    // retrieve sitemap
    const sitemapResponse = await request({
      simple: true,
      method: 'GET',
      uri: sitemapUrl,
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1 Ghostwriter/1.0 (+https://github.com/core-process/ghostwriter)',
      },
    });
    // check if content type fits
    if(sitemapResponse.headers['content-type'] != 'application/xml') {
      throw new Error('invalid content type');
    }
    // parse xml
    const sitemap = xml2js.parseString(sitemapResponse.body);
    // check if it is intermediate sitemap or a final one
    if(  typeof sitemap['sitemapindex'] == 'object'
      && typeof sitemap['sitemapindex']['sitemap'] instanceof Array
    ) {
      for(let entry of typeof sitemap['sitemapindex']['sitemap']) {
        if(entry['loc'] instanceof Array) {
          const subSitemapUrl = entry['loc'].join('');
          try {
            await this.crawlSitemap(config, subSitemapUrl);
          }
          catch(error) {
            console.log(
              'could not retrieve sitemap', subSitemapUrl,
              ' - error:', error.message || 'unknown error'
            );
          }
        }
      }
    }
    else
    if(  typeof sitemap['urlset'] == 'object'
      && typeof sitemap['urlset']['url'] instanceof Array
    ) {
      for(let entry of typeof sitemap['urlset']['url']) {
        if(entry['loc'] instanceof Array) {
          const pageUrl = entry['loc'].join('');
          try {
            await crawl(config, pageUrl, true);
          }
          catch(error) {
            console.log(
              'could not crawl page', pageUrl,
              ' - error:', error.message || 'unknown error'
            );
          }
        }
      }
    }
  }

};
