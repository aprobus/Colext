function UserInfoRouter (config) {
    this.dbConnector = config.dbConnector;
}

UserInfoRouter.prototype.default = function (req, res) {
    this.dbConnector.getAllInformationForUser(req.authorization.email, function (err, results) {
        if (err) {
            res.json({ok: false, error: err});
        } else {
            res.json({ok: true, users: results.users, expenses: results.expenses, payouts: results.payouts}, 200);
        }
    });
};

exports.create = function (config) {
    return new UserInfoRouter(config);
};
