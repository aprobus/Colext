var express = require('express');
var nano = require('nano');
var mysql = require('mysql');
var path = require('path');
var mySqlConnector = require('./databaseConnectors/mySqlConnector');
var appRouter = require('../routes/appRouter');

exports.start = function (config) {
  var app = module.exports = express.createServer();

  var connection = mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    database: 'ret',
    user: config.database.user,
    password: config.database.password
  });
  connection.connect();
  var dbConnector = mySqlConnector.create(connection);

  // Configuration

  var viewsDir = path.join(__dirname, '..', 'views');
  var publicDir = path.join(__dirname, '..', 'public');

  app.configure(function () {
    app.set('views', viewsDir);
    app.set('view engine', 'ejs');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(publicDir));
  });

  app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function () {
    app.use(express.errorHandler());
  });

  // Routes
  appRouter.setupRoutes(app, {dbConnector: dbConnector});

  app.listen(config.server.port, function () {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
  });
};
