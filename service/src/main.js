import phantomjs from 'phantomjs-prebuilt';
import tmp from 'tmp';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
import { ArgumentParser } from 'argparse';
import { validate } from 'jsonschema';
import deepExtend from 'deep-extend';

// globals
let config = {
  refreshRate: 60 * 60 * 1000,
  sandbox: {
    viewportWidth: 1280,
    viewportHeight: 800,
    completionTimeout: 30 * 1000
  }
};
let sitemaps = [ ];
let cache = { };

const CONFIG_SCHEMA = {
  'type': 'object',
  'properties': {
    'refreshRate': { 'type': 'integer', 'minimum': 0 },
    'sandbox': {
      'type': 'object',
      'properties': {
        'viewportWidth': { 'type': 'integer', 'minimum': 0 },
        'viewportHeight': { 'type': 'integer', 'minimum': 0 },
        'completionTimeout': { 'type': 'integer', 'minimum': 0 },
      }
    }
  }
};

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

  // enable logging and body parser
  app.use(morgan('combined'));
  app.use(bodyParser.json());

  // '/configure' route
  app.get('/configure', (request, response) => {
    const newConfig = request.body;
    if(validate(newConfig, CONFIG_SCHEMA).valid) {
      config = deepExtend({}, config, newConfig);
      response.sendStatus(200);
    }
    else {
      response.sendStatus(500);
    }
  });

  // '/add-sitemap' route
  app.get('/add-sitemap', (request, response) => {
    response.sendStatus(200);
  });

  // '/remove-sitemap' route
  app.get('/remove-sitemap', (request, response) => {
    response.sendStatus(200);
  });

  // '/clear-sitemaps' route
  app.get('/clear-sitemaps', (request, response) => {
    response.sendStatus(200);
  });

  // '/clear-cache' route
  app.get('/clear-cache', (request, response) => {
    cache = { };
    response.sendStatus(200);
  });

  // '/retrieve-page' route
  app.get('/retrieve-page', async (request, response) => {
    try {
      // extract params
      if(!request.query.url) {
        throw new Error('url missing');
      }
      // load url
      const item = await load(
        request.query.url,
        config.refreshRate,
        config.sandbox
      );
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
