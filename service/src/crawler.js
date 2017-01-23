import phantomjs from 'phantomjs-prebuilt';
import tmp from 'tmp';
import path from 'path';
import fs from 'fs';
import URI from 'urijs';
import request from 'request-promise';
import base64 from 'base-64';
import adjustUrlBase from './adjust-url-base.js';

export async function crawl(config, url, target) {
  // rebase url
  url = adjustUrlBase(url, config.appUrl);
  console.log('*** ghostwriter:', 'crawling url', url, target);
  // check content type first
  const checkResponse = await request({
    simple: true,
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1 Ghostwriter/1.0 (+https://github.com/core-process/ghostwriter; target '+base64.encode(target)+')',
    },
  });
  const checkContentType = checkResponse.headers['content-type'] || '';
  if(  checkContentType != 'text/html'
    && checkContentType.indexOf('text/html;') !== 0
  ) {
    throw new Error('requested url is not text/html, provided: ' + checkResponse.headers['content-type']);
  }
  // create tmp files
  const tmpContent = tmp.fileSync({ mode: 0o644, prefix: 'ghostwriter-', postfix: '.content' });
  // execute phantomjs script
  const script = phantomjs.exec(
    path.join(__dirname, 'crawler.phantom.js'),
    url, target, tmpContent.name,
    config.sandbox.viewportWidth,
    config.sandbox.viewportHeight,
    config.sandbox.completionTimeout * 1000
  );
  // wait for completion
  let result = await new Promise((resolve, reject) => {
    script.on('exit', code => {
      if(code == 0) {
        const result = JSON.parse(fs.readFileSync(tmpContent.name, { encoding: 'utf8' }));
        tmpContent.removeCallback();
        resolve(result);
      }
      else {
        reject(new Error('phantomjs failed; exit code = ' + code));
      }
    })
  });
  // done
  console.log('*** ghostwriter:', 'crawling completed successfully');
  return result;
}
