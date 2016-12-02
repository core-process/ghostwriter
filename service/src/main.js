import phantomjs from 'phantomjs-prebuilt';
import tmp from 'tmp';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import express from 'express';
import { ArgumentParser } from 'argparse';

// crawler
async function crawl(url, sandboxConfig) {
  console.log('*** ghostwriter:', 'crawling url', url);
  // create tmp files
  const tmpContent = tmp.fileSync({ mode: 0o644, prefix: 'ghostwriter-', postfix: '.content' });
  // execute phantomjs script
  const script = phantomjs.exec(
    path.join(__dirname, 'crawler.phantom.js'),
    url, tmpContent.name,
    sandboxConfig.viewportWidth,
    sandboxConfig.viewportHeight,
    sandboxConfig.completionTimeout
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

// loader
let cache = { };
async function load(url, expiration, sandboxConfig) {
  // load from cache
  console.log('*** ghostwriter:', 'loading url', url);
  if(typeof cache[url] !== 'undefined') {
    // trigger cachin in background
    if(cache[url].expiration < Date.now()) {
      console.log('*** ghostwriter:', 'background crawling url', url);
      crawl(url, sandboxConfig)
        .then((content) => {
          cache[url] = {
            content,
            expiration: expiration + Date.now(),
            sandboxConfig
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
    content: await crawl(url, sandboxConfig),
    expiration: expiration + Date.now(),
    sandboxConfig
  });
}

async function main(port, databaseUri) {

  // setup service
  let app = express();

  // enable logging
  app.use(morgan('combined'));

  // '/clear' route
  app.all('/clear', (request, response) => {
    cache = { };
    response.sendStatus(200);
  });

  // '/retrieve' route
  app.all('/retrieve', async (request, response) => {
    try {
      // extract params
      if(!request.query.url) {
        throw new Error('url missing');
      }
      const url = request.query.url;
      const expiration = request.query.expiration
        ? parseInt(request.query.expiration)
        : 1000 * 60 * 60;
      const sandboxConfig = {
        viewportWidth: request.query.viewportWidth
          ? parseInt(request.query.viewportWidth)
          : 1280,
        viewportHeight: request.query.viewportHeight
          ? parseInt(request.query.viewportHeight)
          : 800,
        completionTimeout: request.query.completionTimeout
          ? parseInt(request.query.completionTimeout)
          : 1000 * 30,
      };
      // load url
      const item = await load(url, expiration, sandboxConfig);
      // send response
      response
        .status(200)
        .type('text/html')
        .send(item.content);
    }
    catch(e) {
      // send response
      response
        .status(500)
        .type('application/json')
        .send(e.message || 'an unknown error occured');
    }
  });

  // listen
  app.listen(port, '0.0.0.0');
  console.log(`Running on http://localhost:${port}`);
}


let parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Ghostwriter Service'
});

parser.addArgument(
  [ '-p', '--port' ],
  { required: true, help: 'port' }
);
parser.addArgument(
  [ '-db', '--database-uri' ],
  { required: true, help: 'database uri' }
);

let args = parser.parseArgs();

main(
  args.port,
  args.database_uri
)
  .then(function() {
    console.log('done!');
  })
  .catch(function(error) {
    console.log('error:', error);
  });
