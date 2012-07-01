var inspect = require('util').inspect;
var authorization = require('../lib/authorization');

function Router (dbConnector) {
    this.dbConnector = dbConnector;
    var self = this;

    this.login = function (req, res) {
        self._login(req, res);
    };

    this.logout = function (req, res) {
        self._logout(req, res);
    };
}

Router.prototype._login = function (req, res) {
    var userName = req.body.userName;
    var password = req.body.password;

    this.dbConnector.logUserIn(userName, password, function (err, sessionToken) {
       if (err) {
           res.header('Set-Cookie', 'authorization=;');
           res.json({ok: false, error: err.message});
       } else if (sessionToken) {
           var userAuth = authorization.create(userName, sessionToken);
           res.header('Set-Cookie', 'authorization=' + userAuth.toEncodedString());
           res.header('Set-Cookie', 'userName=' + userName);
           res.json({ok: true});
       } else {
           res.header('Set-Cookie', 'authorization=;');
           res.json({ok: false, error: 'Unknown error has occurred'});
       }
    });
};

Router.prototype._logout = function (req, res) {
    this.dbConnector.logUserOut(req.authorization.user.userName, function (err) {
        res.header('Set-Cookie', 'authorization=;');
        res.json({ok: true});
    });
};

exports.create = function (dbConnector) {
    return new Router(dbConnector);
};
