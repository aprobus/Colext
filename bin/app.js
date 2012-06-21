var express = require('express');
var nano = require('nano');
var path = require('path');

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

var couchDB = nano('http://192.168.1.101:5984');
var retUsers = couchDB.db.use('ret_users');

// Routes
var routes = {
    main: require('./../routes/index'),
    current: require('./../routes/current').create(retUsers),
    history: require('./../routes/history')
};

app.get('/', routes.main.index);
app.get('/current', routes.current.index);
app.get('/current/add/:userName', routes.current.add);
app.get('/history', routes.history.index);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
