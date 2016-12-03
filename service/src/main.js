import { ArgumentParser } from 'argparse';
import Config from './config.js';
import Cache from './cache.js';
import Service from './service.js';

async function main() {

  let parser = new ArgumentParser({
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

  let args = parser.parseArgs();

  const config = new Config(args.config_database_uri);
  await config.initialize();

  const cache = new Cache(args.cache_database_uri);
  await cache.initialize();

  new Service(args.port, config, cache);
}

main()
  .catch(function(e) {
    console.log('error:', e.message || 'unknown');
  });
