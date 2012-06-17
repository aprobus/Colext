var express = require('express');
var routes = require('./../routes');
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

// Routes
var routes = {
    main: require('./../routes/index'),
    current: require('./../routes/current'),
    history: require('./../routes/history')
};

app.get('/', routes.main.index);
app.get('/current', routes.current.index);
app.get('/history', routes.history.index);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
