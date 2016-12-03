import { validate } from 'jsonschema';
import deepExtend from 'deep-extend';

const CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    refreshRate: { type: 'integer', minimum: 0 },
    sandbox: {
      type: 'object',
      properties: {
        viewportWidth: { type: 'integer', minimum: 0 },
        viewportHeight: { type: 'integer', minimum: 0 },
        completionTimeout: { type: 'integer', minimum: 0 },
      }
    },
    sitemaps: {
      type: 'array',
      items: { type: 'string' },
    },
    baseUrl: { type: 'string' },
  }
};

export default class Config {

  constructor(dbUri) {
    this._config = {
      refreshRate: 60 * 60 * 1000,
      sandbox: {
        viewportWidth: 1280,
        viewportHeight: 800,
        completionTimeout: 30 * 1000
      },
      sitemaps: [ ],
      baseUrl: 'http://application:8888/',
    };
  }

  async initialize() {
  }

  async retrieve(token) {
    return deepExtend({ }, this._config, { token });
  }

  async update(token, update) {
    if(validate(update, CONFIG_SCHEMA).valid) {
      this._config = deepExtend({ }, this._config, update);
    }
    else {
      throw new Error('invalid configuration update');
    }
  }
};
