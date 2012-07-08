var authorization = require('../../lib/authorization');

function SessionRouter (config) {
  this.dbConnector = config.dbConnector;
}

SessionRouter.prototype.login = function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  this.dbConnector.logUserIn(email, password, function (err, sessionToken) {
    if (!err && sessionToken) {
      var userAuth = authorization.create(email, sessionToken).toEncodedString();

      res.header('Set-Cookie', 'authorization=' + userAuth + '; Path=/;');
      res.header('Set-Cookie', 'email=' + email + '; Path=/;');
      res.json({ok: true});
    } else {
      res.header('Set-Cookie', 'authorization=; Path=/;');
      var userError = err || new Error('Unknown error has occurred');
      res.json({ok: false, error: userError.message});
    }
  });
};

SessionRouter.prototype.logout = function (req, res) {
  this.dbConnector.logUserOut(req.authorization.user.email, function (err) {
    res.header('Set-Cookie', 'authorization=; Path=/;');
    res.json({ok: true});
  });
};

exports.create = function (config) {
  return new SessionRouter(config);
};
