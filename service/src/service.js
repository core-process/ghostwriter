import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';

export default class Service {
  constructor(port, config, cache) {
    // set member variables
    this.config = config;
    this.cache = cache;
    // setup service
    let app = express();
    // enable logging and body parser
    app.use(morgan('combined'));
    app.use(bodyParser.json());
    // install routes
    app.post('/configure', this.configureRoute.bind(this));
    app.get('/clear-cache', this.clearCacheRoute.bind(this));
    app.get('/retrieve-page', this.retrievePageRoute.bind(this));
    // listen
    app.listen(port, '0.0.0.0');
    console.log(`Running on http://localhost:${port}`);
  }

  async configureRoute(request, response) {
    try {
      // validate input
      if(!request.query.token) {
        throw new Error('token missing');
      }
      if(typeof request.body !== 'object') {
        throw new Error('configuration missing (request-body)');
      }
      // update configuration
      await this.config.update(request.query.token, request.body);
      // send response
      response
        .status(200)
        .json({});
    }
    catch(error) {
      // send response
      response
        .status(500)
        .json({ error: error.message || 'unknown error' });
    }
  }

  async clearCacheRoute(request, response) {
    try {
      // validate input
      if(!request.query.token) {
        throw new Error('token missing');
      }
      // clear cache
      await this.cache.clear(
        await this.config.retrieve(request.query.token)
      );
      // send response
      response
        .status(200)
        .json({});
    }
    catch(error) {
      // send response
      response
        .status(500)
        .json({ error: error.message || 'unknown error' });
    }
  }

  async retrievePageRoute(request, response) {
    try {
      // validate input
      if(!request.query.token) {
        throw new Error('token missing');
      }
      if(!request.query.pageUrl) {
        throw new Error('page-url missing');
      }
      // retrieve page
      const page = await this.cache.retrievePage(
        await this.config.retrieve(request.query.token),
        request.query.pageUrl
      );
      // send response
      response
        .status(200)
        .json(page);
    }
    catch(error) {
      // send response
      response
        .status(500)
        .json({ error: error.message || 'unknown error' });
    }
  }
};
