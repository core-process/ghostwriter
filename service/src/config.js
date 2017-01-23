import { validate } from 'jsonschema';
import deepExtend from 'deep-extend';
import _ from 'underscore';

import CONFIG_SCHEMA from 'ghostwriter-common/build/config-schema.js';

const CONFIG_DEFAULT = Object.freeze({
  version: 'unknown',
  refreshCycle: 1.0,
  sandbox: Object.freeze({
    viewportWidth: 1280,
    viewportHeight: 800,
    completionTimeout: 30.0,
  }),
  sitemaps: Object.freeze([
    '/sitemap.xml',
  ]),
  targets: Object.freeze([
    'standard',
    'facebook',
    'twitter',
    'pinterest',
  ]),
  appUrl: 'http://localhost',
});

export default class Config {

  constructor(configCollection) {
    this._configCollection = configCollection;
  }

  async retrieve(token) {
    // retrieve current config...
    let config = await this._configCollection.findOne({ _id: token });
    if(config) {
      config.token = config._id;
      delete config._id;
      return config;
    }
    // ... none found
    return null;
  }

  async retrieveAll() {
    let configs = await this._configCollection.find().toArray();
    return configs.map(
      (config) => _.extend({ }, _.omit(config, '_id'), { token: config._id })
    );
  }

  async update(token, update) {
    // validate schema
    if(!validate(update, CONFIG_SCHEMA).valid) {
      throw new Error('invalid configuration update');
    }
    // retrieve current config
    let config = await this.retrieve(token);
    if(config) {
      delete config.token;
    }
    else {
      config = deepExtend({ }, CONFIG_DEFAULT);
    }
    // update config
    config = deepExtend({ }, config, update);
    // store updated config in database
    await this._configCollection.findAndModify(
      { _id: token },
      [[ '_id', 'asc' ]],
      config,
      { upsert: true, w: 'majority' }
    );
  }
};
