
function Router (dbConnector) {
    this.dbConnector = dbConnector;

    var self = this;
    this.index = function (req, res) {
        self._index(req, res);
    };

    this.add = function (req, res) {
        var email = req.authorization.user.email;
        var expense = parseExpense(req.query.amount, req.query.comment);
        var errors = getValidationErrors(email, expense);

        if (errors.length > 0) {
            res.json({ok: false, error: errors[0], status: 200});
            return;
        }

        self._add(req.authorization.user, expense, res);
    };
}

Router.prototype._add = function(user, expense, res){
    this.dbConnector.addExpense(user, expense.amount, expense.comment, function (err) {
       if (err) {
           res.json({ok: false, error: err});
       } else {
           res.json({ok: true});
       }
    });
};

Router.prototype._index = function(req, res){
    this.dbConnector.getAllInformationForUser(req.authorization.email, function (err, results) {
       if (err) {
           res.json({ok: false, error: err});
       } else {
           res.json({ok: true, users: results.users, expenses: results.expenses, payouts: results.payouts}, 200);
       }
    });
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
        amount: numericAmount,
        timeStamp: new Date().getTime()
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

exports.create = function (retUsersDb) {
    return new Router(retUsersDb);
};
