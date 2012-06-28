var authorization = require('./../authorization');

module.exports = function credentialsValidator(couchDb){
    return function (req, res, next) {
        if (req.authorization && req.authorization.userName && req.authorization.sessionId) {
            var usersDb = couchDb.use('ret_users');

            usersDb.get(req.authorization.userName, onGetUser);
        } else {
            next(new Error('Unable to validation'));
        }

        function onGetUser (err, user) {
            if (err) {
                next(err);
            } else if (user.sessionId === req.authorization.sessionId) {
                req.authorization.user = user;
                next();
            } else {
                next(new Error('Invalid session'));
            }
        }
    };
};
