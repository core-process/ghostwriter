#!/usr/bin/env node

import { ArgumentParser } from 'argparse';
import { MongoClient } from 'mongodb';
import Config from './config.js';
import Cache from './cache.js';
import SitemapCrawler from './sitemap-crawler.js';
import Service from './service.js';

async function setup() {
  // prepare parser
  const parser = new ArgumentParser({
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
  parser.addArgument(
    [ '-keep-db', '--keep-database' ],
    { required: false, help: 'keep current database (otherwise we will recreate it)', action: 'storeTrue', defaultValue: false }
  );
  // parse arguments
  const args = parser.parseArgs();
  // connect to database
  const db = await MongoClient.connect(args.database_uri);
  // drop database
  if(!args.keep_database) {
    console.log('dropping existing database...');
    await db.dropDatabase();
  }
  // initialize web service and sitemap crawler
  console.log('starting service...');
  const
    config = new Config(db.collection('config')),
    cache = new Cache(db.collection('page'));
  new Service(
    args.port,
    config,
    cache
  );
  new SitemapCrawler(
    config,
    cache
  );
}

setup()
  .catch(function(e) {
    console.log('error:', e.message || 'unknown');
  });
