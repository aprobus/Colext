var authorization = require('./../authorization');

module.exports = function credentialsValidator(dbConnector){
    return function (req, res, next) {
        if (req.authorization && req.authorization.email && req.authorization.sessionId) {
            dbConnector.getLoggedInUser(req.authorization.email, req.authorization.sessionId, onGetLoggedInUser);
        } else {
            next(new Error('Unable to perform validation'));
        }

        function onGetLoggedInUser (err, user) {
            if (err) {
                res.json({ok: false, error: 'Error occurred while accessing database'})
            } else if (user) {
                req.authorization.user = user;
                next();
            } else {
                res.json({ok: false, error: 'Unknown error occurred'});
            }
        }
    };
};
