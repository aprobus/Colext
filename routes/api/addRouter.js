function AddRouter (config) {
  this.dbConnector = config.dbConnector;
}

AddRouter.prototype.addExpense = function (req, res) {
  var email = req.authorization.user.email;
  var expense = parseExpense(req.body.amount, req.body.comment);
  var errors = getValidationErrors(email, expense);

  if (errors.length > 0) {
    res.json({ok: false, error: errors[0], status: 200});
    return;
  }

  this.dbConnector.addExpense(req.authorization.user, expense.amount, expense.comment, function (err) {
    if (err) {
      res.json({ok: false, error: err});
    } else {
      res.json({ok: true});
    }
  });
};

AddRouter.prototype.addPayout = function (req, res) {
  this.dbConnector.addPayout(req.authorization.user.groupId, function (err) {
    if (err) {
      res.json({ok: false, error: err}, 200);
    } else {
      res.json({ok: true}, 200);
    }
  });
};

exports.create = function (config) {
  return new AddRouter(config);
};

function parseExpense (amount, comment) {
  var numericAmount = NaN;
  var typeOfAmount = typeof(amount);
  if (typeOfAmount === 'number') {
    numericAmount = amount;
  } else if (typeOfAmount === 'string') {
    numericAmount = parseFloat(amount);
  }

  var expense = {
    comment: comment,
    amount: numericAmount
  };

  return expense;
}

function getValidationErrors (email, expense) {
  var errors = [];

  if (!email) {
    errors.push('Must specify an email address');
  }

  if (!expense.comment) {
    errors.push('Must specify a comment');
  }

  if (isNaN(expense.amount)) {
    errors.push('Amount must be a number');
  } else if (expense.amount <= 0) {
    errors.push('Amount must be positive');
  }

  return errors;
}
