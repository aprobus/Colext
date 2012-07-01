
function Router (dbConnector) {
    this.dbConnector = dbConnector;

    var self = this;
    this.index = function (req, res) {
        self._index(req, res);
    };

    this.add = function (req, res) {
        var userName = req.params.userName;
        var expense = parseExpense(req.query.amount, req.query.comment);

        var errors = getValidationErrors(userName, expense);

        if (errors.length > 0) {
            res.json({errors: errors, status: 200});
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
    this.dbConnector.getAllInformationForUser(req.authorization.userName, function (err, results) {
       if (err) {
           res.json({ok: false, error: err});
       } else {
           res.json({ok: true, users: results.users, expenses: results.expenses}, 200);
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

function getValidationErrors (userName, expense) {
    var errors = [];

    if (!userName) {
        errors.push('Must specify a user name');
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
