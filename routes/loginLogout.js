var inspect = require('util').inspect;
var authorization = require('../lib/authorization');
var hat = require('hat');

function Router (couchDb) {
    this.couchDb = couchDb;
    var self = this;

    this.login = function (req, res) {
        self._login(req, res);
    }

    this.logout = function (req, res) {
        self._logout(req, res);
    }
}

Router.prototype._login = function (req, res) {
    var userName = req.body.userName;
    var password = req.body.password;

    var usersDb = this.couchDb.use('ret_users');

    usersDb.get(userName, function (err, user) {
        if (password === user.password) {
            var sessionId = hat();

            user.sessionId = sessionId;
            usersDb.insert(user, userName, function (err) {
                var userAuth = authorization.create(userName, sessionId);
                res.header('Set-Cookie', 'authorization=' + userAuth.toEncodedString());
                res.header('Set-Cookie', 'userName=' + userName);
                res.json({ok: true}, 200);
            });
        } else {
            res.header('Set-Cookie', 'authorization=;');
            res.header('Set-Cookie', 'userName=;');
            res.json({ok: false}, 200);
        }
    });
};

Router.prototype._logout = function (req, res) {
    var usersDb = this.couchDb.use('ret_users');

    req.authorization.user.sessionId = hat();
    usersDb.insert(req.authorization.user, req.authorization.user.userName, function () {
        res.header('Set-Cookie', 'authorization=;');
        res.json({ok: true});
    });
};

exports.create = function (couchDb) {
    return new Router(couchDb);
};
