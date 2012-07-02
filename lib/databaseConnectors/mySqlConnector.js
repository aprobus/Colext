var hat = require('hat');
var async = require('async');
var inspect = require('util').inspect;

function MySqlConnector (connection) {
    this.connection = connection;
}

MySqlConnector.prototype.getExpensesForUser = function (userName, callback) {
    this.connection.query('select userName, amount, timeStamp, comment from users join expenses on users.id = userId and expenses.groupId in (select groupId from users where userName = ?)', [userName], callback);
};

MySqlConnector.prototype.getUsersInSameGroup = function (userName, callback) {
    this.connection.query('select firstName, lastName, userName from users where groupId in (select groupId from users where userName = ?)', [userName], callback);
};

MySqlConnector.prototype.getLoggedInUser = function (userName, sessionToken, callback) {
  this.connection.query('select id, groupId, userName from users where userName = ? and sessionToken = ?', [userName, sessionToken], function (err, rows) {
     callback(err, rows && rows[0]);
  });
};

MySqlConnector.prototype.getAllInformationForUser = function (userName, callback) {
    async.series({
        users: this.getUsersInSameGroup.bind(this, userName),
        expenses: this.getExpensesForUser.bind(this, userName)
    }, function (err, results) {
        if (err) {
            return callback(err);
        }

        var info = {
            users: results.users[0],
            expenses: results.expenses[0]
        };

        callback(null, info);
    });
};

MySqlConnector.prototype.addExpense = function (user, amount, comment, callback) {
    var timeStamp = new Date().getTime() / 1000;

    this.connection.query('insert into expenses (userId, groupId, amount, timeStamp, comment) values (?, ?, ?, ?, ?)', [user.id, user.groupId, amount, timeStamp, comment], callback);
};

MySqlConnector.prototype.logUserIn = function (userName, password, callback) {
    var sessionToken = hat();
    this.connection.query('update users set sessionToken = ? where userName = ? and password = ?', [sessionToken, userName, password], function (err, rows) {
        if (err) {
            return callback(err);
        } else if (rows.affectedRows === 0) {
            callback(new Error('Invalid username/password'));
        } else {
            callback(null, sessionToken);
        }
    });
};

MySqlConnector.prototype.logUserOut = function (userName, callback) {
    this.connection.query('update users set sessionToken = null where userName = ?', [userName], function (err) {
        callback(err);
    });
};

MySqlConnector.prototype.addPayout = function (groupId, callback) {
    this.connection.query('insert into payouts (groupId, timeStamp) values (?, ?)', [groupId, new Date().getTime() / 1000], function (err, result) {
        if (err) {
            callback(err);
        } else if (result.affectedRows !== 1) {
            callback(new Error('Unknown error occurred while trying to perform a payout'));
        } else {
            callback();
        }
    });
};

exports.create = function (connection) {
    return new MySqlConnector(connection);
};
