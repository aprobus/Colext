function RemoveRouter (config) {
  this.dbConnector = config.dbConnector;
}

RemoveRouter.prototype.removeExpense = function (req, res) {
  var email = req.authorization.user.email;
  var expenseId = NaN;

  try {
    expenseId = parseInt(req.body.expenseId);
  } catch (err) {
    expenseId = NaN;
  }

  if (!expenseId) {
    res.json({ok: false, error: 'No expense id specified'});
    return;
  } else if (typeof(expenseId) !== 'number' || isNaN(expenseId) || expenseId <= 1) {
    res.json({ok: false, error: 'Invalid expense id'});
    return;
  }

  this.dbConnector.removeExpense(email, expenseId, function (err) {
    if (err) {
      res.json({ok: false, error: err.message});
    } else {
      res.json({ok: true});
    }
  });
};

exports.create = function (config) {
  return new RemoveRouter(config);
};

