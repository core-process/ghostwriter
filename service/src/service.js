import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
import * as appConfig from './app-config.js';
import * as appCache from './app-cache.js';

function routeConfigure(request, response) {
  try {
    appConfig.update(request.body);
    response.sendStatus(200);
  }
  catch(e) {
    response.sendStatus(500);
  }
}

function routeClearCache(request, response) {
  appCache.clear();
  response.sendStatus(200);
}

async function routeRetrievePage(request, response) {
  try {
    // extract params
    if(!request.query.url) {
      throw new Error('url missing');
    }
    // load url
    const item = await appCache.retrieve(
      request.query.url,
      appConfig.get()
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
}

export default async function service(port) {

  // setup service
  let app = express();

  // enable logging and body parser
  app.use(morgan('combined'));
  app.use(bodyParser.json());

  // install routes
  app.get('/configure', routeConfigure);
  app.get('/clear-cache', routeClearCache);
  app.get('/retrieve-page', routeRetrievePage);

  // listen
  app.listen(port, '0.0.0.0');
  console.log(`Running on http://localhost:${port}`);
}
