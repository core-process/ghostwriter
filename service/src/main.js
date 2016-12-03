import { ArgumentParser } from 'argparse';
import Config from './config.js';
import Cache from './cache.js';
import Service from './service.js';

async function setup() {

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
    [ '-config-db', '--config-database-uri' ],
    { required: true, help: 'config database uri' }
  );
  parser.addArgument(
    [ '-cache-db', '--cache-database-uri' ],
    { required: true, help: 'cache database uri' }
  );

  const args = parser.parseArgs();

  const config = await (new Config).initialize(args.config_database_uri);
  const cache = await (new Cache).initialize(args.cache_database_uri);

  return new Service(args.port, config, cache);
}

setup()
  .catch(function(e) {
    console.log('error:', e.message || 'unknown');
  });
