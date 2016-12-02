import { ArgumentParser } from 'argparse';
import service from './service.js';

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
  [ '-db', '--database-uri' ],
  { required: true, help: 'database uri' }
);

let args = parser.parseArgs();

service(
  args.port
)
  .then(function() {
    console.log('done!');
  })
  .catch(function(error) {
    console.log('error:', error);
  });
