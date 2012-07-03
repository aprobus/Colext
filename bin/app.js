var express = require('express');
var nano = require('nano');
var mysql = require('mysql');
var commander = require('commander');
var path = require('path');
var mySqlConnector = require('../lib/databaseConnectors/mySqlConnector');
var authParser = require('../lib/middleWare/authParser');
var credentialsValidator = require('../lib/middleWare/credentialsValidator');
var configLoader = require('../lib/configLoader');

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
    if (err || !config) {
        console.error('Unable to load configuration!');
        return;
    }

    var app = module.exports = express.createServer();

    var connection = mysql.createConnection({
        host     : config.database.host,
        port     : config.database.port,
        database : 'ret',
        user     : commander.user,
        password : commander.password
    });
    connection.connect();
    var dbConnector = mySqlConnector.create(connection);

    // Configuration

    var viewsDir = path.join(__dirname, '..', 'views');
    var publicDir = path.join(__dirname, '..', 'public');

    app.configure(function(){
        app.set('views', viewsDir);
        app.set('view engine', 'ejs');
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(publicDir));
    });

    app.configure('development', function(){
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function(){
        app.use(express.errorHandler());
    });

    // Routes
    var routes = {
        main: require('./../routes/index'),
        current: require('./../routes/current').create(dbConnector),
        payout: require('./../routes/payout').create(dbConnector),
        loginLogout: require('./../routes/loginLogout').create(dbConnector)
    };

    var requiresAuth = authParser();
    var requiresValidUser = credentialsValidator(dbConnector);

    app.get('/', routes.main.index);
    app.get('/current', requiresAuth, requiresValidUser, routes.current.index);
    app.get('/current/add/:userName', requiresAuth, requiresValidUser, routes.current.add);
    app.get('/payout', requiresAuth, requiresValidUser, routes.payout.add);
    app.post('/login', routes.loginLogout.login);
    app.get('/logout', requiresAuth, requiresValidUser, routes.loginLogout.logout);

    app.listen(config.server.port, function(){
        console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
    });
});
