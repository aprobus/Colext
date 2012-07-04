var hat = require('hat');
var async = require('async');
var inspect = require('util').inspect;

function MySqlConnector (connection) {
    this.connection = connection;
}

MySqlConnector.prototype.getExpensesForUser = function (email, callback) {
    this.connection.query('select email, amount, timeStamp, comment from users join expenses on users.id = userId and expenses.groupId in (select groupId from users where email = ?)', [email], callback);
};

MySqlConnector.prototype.getUsersInSameGroup = function (email, callback) {
    this.connection.query('select firstName, lastName, email from users where groupId in (select groupId from users where email = ?)', [email], callback);
};

MySqlConnector.prototype.getLoggedInUser = function (email, sessionToken, callback) {
  this.connection.query('select id, groupId, email from users where email = ? and sessionToken = ?', [email, sessionToken], function (err, rows) {
     callback(err, rows && rows[0]);
  });
};

MySqlConnector.prototype.getAllInformationForUser = function (email, callback) {
    async.series({
        users: this.getUsersInSameGroup.bind(this, email),
        expenses: this.getExpensesForUser.bind(this, email),
        payouts: this.getPayoutsForUser.bind(this, email)
    }, function (err, results) {
        if (err) {
            return callback(err);
        }

        var info = {
            users: results.users[0],
            expenses: results.expenses[0],
            payouts: results.payouts
        };

        callback(null, info);
    });
};

MySqlConnector.prototype.getPayoutsForUser = function (email, callback) {
    this.connection.query('select timeStamp from payouts where groupId in (select groupId from users where email = ?)', [email], function (err, rows) {
        if (err) {
            return callback(err);
        }

        var payouts = rows.map(function (row) {
            return row.timeStamp;
        });
        callback(null, payouts);
    });
};

MySqlConnector.prototype.addExpense = function (user, amount, comment, callback) {
    var timeStamp = new Date().getTime() / 1000;

    this.connection.query('insert into expenses (userId, groupId, amount, timeStamp, comment) values (?, ?, ?, ?, ?)', [user.id, user.groupId, amount, timeStamp, comment], callback);
};

MySqlConnector.prototype.logUserIn = function (email, password, callback) {
    var sessionToken = hat();
    this.connection.query('update users set sessionToken = ? where email = ? and password = ?', [sessionToken, email, password], function (err, rows) {
        if (err) {
            return callback(err);
        } else if (rows.affectedRows === 0) {
            callback(new Error('Invalid email/password'));
        } else {
            callback(null, sessionToken);
        }
    });
};

MySqlConnector.prototype.logUserOut = function (email, callback) {
    this.connection.query('update users set sessionToken = null where email = ?', [email], function (err) {
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

MySqlConnector.prototype.createDatabase = function (callback) {
    var self = this;

    var groupsTable = 'create table groups (' +
                      'id int unsigned auto_increment primary key, ' +
                      'name varchar(64) not null unique' +
                      ')';

    var usersTable = 'create table users (' +
                     'id int unsigned auto_increment primary key, ' +
                     'firstName varchar(63) not null, ' +
                     'lastName varchar(63) not null, ' +
                     'email varchar(63) not null unique,' +
                     'password varchar(63) not null, ' +
                     'sessionToken varchar(255), ' +
                     'groupId int unsigned not null, ' +
                     'foreign key (groupId) references groups (id)' +
                     ')';

    var expensesTable = 'create table expenses (' +
                        'id int unsigned auto_increment primary key, ' +
                        'userId int unsigned not null,' +
                        'groupId int unsigned not null, ' +
                        'amount float not null, ' +
                        'comment varchar(255) not null, ' +
                        'timeStamp int unsigned not null, ' +
                        'foreign key(userId) references users(id), ' +
                        'foreign key(groupId) references groups(id)' +
                        ')';

    var payoutsTable = 'create table payouts (' +
                       'id int unsigned auto_increment primary key, ' +
                       'groupId int unsigned not null, ' +
                       'timeStamp int unsigned not null, ' +
                       'foreign key(groupId) references groups(id)' +
                       ')';

    async.series([
        self.connection.query.bind(self.connection, groupsTable),
        self.connection.query.bind(self.connection, usersTable),
        self.connection.query.bind(self.connection, expensesTable),
        self.connection.query.bind(self.connection, payoutsTable)
    ], callback);
};

exports.create = function (connection) {
    return new MySqlConnector(connection);
};
