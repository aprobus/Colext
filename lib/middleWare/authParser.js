var authorization = require('./../authorization');

module.exports = function authParser(){
    return function (req, res, next) {
        if (req && req.cookies && req.cookies.authorization) {
            req.authorization = authorization.parse(req.cookies.authorization);
            next();
        } else {
            next(new Error('Missing authorization'));
        }
    };
};
