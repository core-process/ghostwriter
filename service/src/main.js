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
  // parse arguments
  const args = parser.parseArgs();
  // connect to database
  const db = await MongoClient.connect(args.database_uri);
  // initialize web service and sitemap crawler
  const
    config = new Config(db.collection('config')),
    cache = new Cache(db.collection('page'));
  new Service(
    args.port,
    config,
    cache
  );
  new SitemapCrawler(
    db.collection('sitemap'),
    config,
    cache
  );
}

setup()
  .catch(function(e) {
    console.log('error:', e.message || 'unknown');
  });
