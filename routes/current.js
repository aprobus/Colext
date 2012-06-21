
function Router (usersDb) {
    this.usersDb = usersDb;

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

        self._add(userName, expense, res);
    };
}

Router.prototype._add = function(userName, expense, res){
    var self = this;
    this.usersDb.get(userName, function (err, user) {
       if (err) {
           res.json({errors: [err], status: 200});
           return;
       }

       user.expenses.push(expense);

       self.usersDb.insert(user, userName, function (err) {
          if (err) {
              res.json({errors: [err], status: 200});
          } else {
              res.json({status: 200});
          }
       });
    });
};

Router.prototype._index = function(req, res){
    var self = this;
    this.usersDb.list(function (err, docsList) {
        if (err) {
            res.json({error: err }, 200);
            return;
        }

        var keys = docsList.rows.map(function (doc) {
           return doc.key;
        });

        var fetchOptions = {
            keys: keys
        };

        self.usersDb.fetch(fetchOptions, function (err, docs) {
           if (err) {
               res.json({error: err }, 200);
               return;
           }

            var retUsers = docs.rows.map(function (doc) {
                return new RetUser(doc.key, doc.doc);
            });

            res.json(retUsers, 200);
        });
    });
};

function RetUser (key, doc) {
    this.userName = key;
    this.name = doc.name;
    this.expenses = doc.expenses;
}

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
        timeStamp: new Date()
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
