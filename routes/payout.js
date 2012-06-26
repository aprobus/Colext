function Router (couchServer) {
    this.server = couchServer;

    var self = this;

    this.add = function (req, res) {
        self.addExpense(req, res);
    }
}

Router.prototype.addExpense = function (req, res) {
    res.json({ok: true}, 200);
};

exports.create = function (couchServer) {
  return new Router(couchServer);
};
