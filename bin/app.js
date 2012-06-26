var express = require('express');
var nano = require('nano');
var path = require('path');
var configLoader = require('../lib/configLoader');

configLoader.load(function (err, config) {
    if (err || !config) {
        console.error('Unable to load configuration!');
        return;
    }

    var app = module.exports = express.createServer();

    // Configuration

    var viewsDir = path.join(__dirname, '..', 'views');
    var publicDir = path.join(__dirname, '..', 'public');

    app.configure(function(){
        app.set('views', viewsDir);
        app.set('view engine', 'ejs');
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

    var couchDB = nano('http://' + config.couch.host + ':' + config.couch.port);
    var retUsers = couchDB.db.use('ret_users');

    // Routes
    var routes = {
        main: require('./../routes/index'),
        current: require('./../routes/current').create(retUsers),
        payout: require('./../routes/payout').create(couchDB)
    };

    app.get('/', routes.main.index);
    app.get('/current', routes.current.index);
    app.get('/current/add/:userName', routes.current.add);
    app.get('/payout', routes.payout.add);

    app.listen(config.server.port, function(){
        console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
    });
});
