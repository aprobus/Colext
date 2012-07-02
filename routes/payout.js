function PayoutRouter (dbConnector) {
    this.dbConnector = dbConnector;

    var self = this;

    this.add = function (req, res) {
        self.addExpense(req, res);
    }
}

PayoutRouter.prototype.addExpense = function (req, res) {
    this.dbConnector.addPayout(req.authorization.user.groupId, function (err) {
        if (err) {
            res.json({ok: false, error: err}, 200);
        } else {
            res.json({ok: true}, 200);
        }
    });

};

exports.create = function (dbConnector) {
  return new PayoutRouter(dbConnector);
};
