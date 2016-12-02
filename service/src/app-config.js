import { validate } from 'jsonschema';
import deepExtend from 'deep-extend';

let config = {
  refreshRate: 60 * 60 * 1000,
  sandbox: {
    viewportWidth: 1280,
    viewportHeight: 800,
    completionTimeout: 30 * 1000
  },
  sitemaps: [ ],
  baseUrl: 'http://application:8888/',
};

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

export function get() {
  return config;
}

export function update(update) {
  if(validate(update, CONFIG_SCHEMA).valid) {
    config = deepExtend({}, config, update);
  }
  else {
    throw new Error('invalid app configuration update');
  }
}
