var configLoader = require('../lib/configLoader');
var commander = require('commander');
var expensesServer = require('../lib/expensesServer');

commander.version('0.0.1').option('-u, --user <userName>', 'Database user').option('-p, --password <password>', 'Password for user').parse(process.argv);

if (!commander.user) {
  console.error('Must specify a user!');
  process.exit();
}

if (!commander.password) {
  console.error('Must specify a password!');
  process.exit();
}

configLoader.load(function (err, config) {
  if (err || !config) {
    console.error('Unable to load configuration!');
    return;
  }

  config.database.user = commander.user;
  config.database.password = commander.password;

  expensesServer.start(config);
});
