import { validate } from 'jsonschema';
import deepExtend from 'deep-extend';

import CONFIG_SCHEMA from 'ghostwriter-common/build/config-schema.js';

const CONFIG_DEFAULT = Object.freeze({
  refreshCycle: 60 * 60 * 1000,
  sandbox: Object.freeze({
    viewportWidth: 1280,
    viewportHeight: 800,
    completionTimeout: 30 * 1000,
  }),
  sitemaps: Object.freeze([
    'http://application:8888/sitemap.xml',
  ]),
  baseUrl: 'http://application:8888/',
});

export default class Config {

  constructor(collection) {
    this._collection = collection;
  }

  async retrieve(token) {
    // retrieve current config...
    let config = await this._collection.findOne({ _id: token });
    if(config) {
      config.token = config._id;
      delete config._id;
      return config;
    }
    // ... or use default one
    return deepExtend({ }, CONFIG_DEFAULT, { token });
  }

  async update(token, update) {
    // validate schema
    if(!validate(update, CONFIG_SCHEMA).valid) {
      throw new Error('invalid configuration update');
    }
    // retrieve current config
    let config = await this.retrieve(token);
    delete config.token;
    // update config
    config = deepExtend({ }, config, update);
    // store updated config in database
    await this._collection.findAndModify(
      { _id: token },
      [[ '_id', 'asc' ]],
      config,
      { upsert: true, w: 'majority' }
    );
  }
};
