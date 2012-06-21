
function Router (usersDb) {
    this.usersDb = usersDb;

    var self = this;
    this.index = function (req, res) {
        self._index(req, res);
    };

    this.add = function (req, res) {
        var userName = req.params.userName;

        var expense = {
            timeStamp: new Date(),
            amount: parseInt(req.query.amount),
            comment: req.query.comment
        };

        var validationError = null;
        if (!userName) {
            validationError = new Error('Must specify a username');
        } else if (!expense.amount || isNaN(expense.amount)) {
            validationError = new Error('Invalid amount specified');
        } else if (!expense.comment) {
            validationError = new Error('Must specify a comment');
        }

        if (validationError) {
            res.json({error: validationError, status: 200});
            return;
        }

        self._add(userName, expense, res);
    };
}

Router.prototype._add = function(userName, expense, res){
    var self = this;
    this.usersDb.get(userName, function (err, user) {
       if (err) {
           res.json({error: err, status: 200});
           return;
       }

       user.expenses.push(expense);

       self.usersDb.insert(user, userName, function (err) {
          if (err) {
              res.json({error: err, status: 200});
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

exports.create = function (retUsersDb) {
    return new Router(retUsersDb);
};
