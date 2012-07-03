var commander = require('commander');
var configLoader = require('../lib/configLoader');
var mysql = require('mysql');
var mySqlConnector = require('../lib/databaseConnectors/mySqlConnector');

commander
    .version('0.0.1')
    .option('-u, --user <userName>', 'Database user')
    .option('-p, --password <password>', 'Password for user')
    .parse(process.argv);

if (!commander.user) {
    console.error('Must specify a user!');
    process.exit();
}

if (!commander.password) {
    console.error('Must specify a password!');
    process.exit();
}

configLoader.load(function (err, config) {
    var connection = mysql.createConnection({
        host     : config.database.host,
        port     : config.database.port,
        database : 'ret',
        user     : commander.user,
        password : commander.password
    });
    connection.connect();
    var dbConnector = mySqlConnector.create(connection);

    dbConnector.createDatabase(function (err) {
       if (err) {
           console.error('Unable to complete process: ' + err);
           console.error(err.stack);
       } else {
           console.log('Completed successfully!');
       }

       connection.end();
    });
});
