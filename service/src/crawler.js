import phantomjs from 'phantomjs-prebuilt';
import tmp from 'tmp';
import path from 'path';
import fs from 'fs';
import URI from 'urijs';

export async function crawl(url, config) {
  console.log('*** ghostwriter:', 'crawling url', url);
  // finalize url
  url = new URI(url);
  if (url.is('relative')) {
      url = url.absoluteTo(config.baseUrl);
  }
  url = url.toString();
  // create tmp files
  const tmpContent = tmp.fileSync({ mode: 0o644, prefix: 'ghostwriter-', postfix: '.content' });
  // execute phantomjs script
  const script = phantomjs.exec(
    path.join(__dirname, 'crawler.phantom.js'),
    url, tmpContent.name,
    config.sandbox.viewportWidth,
    config.sandbox.viewportHeight,
    config.sandbox.completionTimeout
  );
  // wait for completion
  let content = await new Promise((resolve, reject) => {
    script.on('exit', code => {
      if(code == 0) {
        const content = fs.readFileSync(tmpContent.name, { encoding: 'utf8' });
        tmpContent.removeCallback();
        resolve(content);
      }
      else {
        reject(new Error('phantomjs failed; exit code = ' + code));
      }
    })
  });
  // done
  console.log('*** ghostwriter:', 'crawling completed successfully');
  return content;
}
