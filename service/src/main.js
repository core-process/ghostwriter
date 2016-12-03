import { ArgumentParser } from 'argparse';
import { MongoClient } from 'mongodb';
import Config from './config.js';
import Cache from './cache.js';
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
  // initialize service
  return new Service(
    args.port,
    new Config(db.collection('config')),
    new Cache(db.collection('cache'))
  );
}

setup()
  .catch(function(e) {
    console.log('error:', e.message || 'unknown');
  });
