var sessionRouter = require('./api/sessionRouter');
var addRouter = require('./api/addRouter');
var userInfoRouter = require('./api/userInfoRouter');
var indexRouter = require('./indexRouter');
var authParser = require('../lib/middleWare/authParser');
var credentialsValidator = require('../lib/middleWare/credentialsValidator');

exports.setupRoutes = function (app, config) {
  var apiSession = sessionRouter.create(config);
  var apiAdd = addRouter.create(config);
  var apiUserInfo = userInfoRouter.create(config);
  var index = indexRouter.create(config);

  var requiresAuth = authParser();
  var requiresValidUser = credentialsValidator(config.dbConnector);

  app.get('/', index.home.bind(index));

  app.get('/api/userInfo', requiresAuth, requiresValidUser, apiUserInfo.default.bind(apiUserInfo));

  app.post('/api/add/expense', requiresAuth, requiresValidUser, apiAdd.addExpense.bind(apiAdd));
  app.post('/api/add/payout', requiresAuth, requiresValidUser, apiAdd.addPayout.bind(apiAdd));

  app.post('/api/session/login', apiSession.login.bind(apiSession));
  app.get('/api/session/logout', requiresAuth, requiresValidUser, apiSession.login.bind(apiSession));
};
