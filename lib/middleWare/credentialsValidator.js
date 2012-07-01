var authorization = require('./../authorization');

module.exports = function credentialsValidator(dbConnector){
    return function (req, res, next) {
        if (req.authorization && req.authorization.userName && req.authorization.sessionId) {
            dbConnector.getLoggedInUser(req.authorization.userName, req.authorization.sessionId, onGetLoggedInUser);
        } else {
            next(new Error('Unable to perform validation'));
        }

        function onGetLoggedInUser (err, user) {
            if (err) {
                next(err);
            } else if (user) {
                req.authorization.user = user;
                next();
            } else {
                next(new Error('Invalid session'));
            }
        }
    };
};
