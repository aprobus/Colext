var nano = require('nano');
var async = require('async');
var util = require('util');
var configLoader = require('./configLoader');

function inspect (obj) {
    console.log(util.inspect(obj));
}

exports.saveUsersAndGroup = function (users, group, callback) {
    var server;
    async.waterfall([configLoader.load, makeDb, saveGroup, fetchUsers, saveUsers], callback);

    function makeDb (config, callback) {
        server = nano('http://' + config.couch.host + ':' + config.couch.port);
        callback();
    }

    function saveGroup (callback) {
        var groupDb = server.use('ret_groups');

        var retGroup = {
            name: group.name,
            members: [],
            payouts: []
        };

        for (var i = 0; i < users.length; i++) {
            retGroup.members.push(users[i].userName);
        }

        groupDb.insert(retGroup, callback);
    }

    function fetchUsers (body, header, callback) {
        if (!body.ok || !body.id) {
            callback(new Error('Unknown error occurred while saving the group'));
        }

        var groupId = body.id;
        var usersDb = server.use('ret_users');

        var userNames = users.map(function (user) {
            return user.userName;
        });

        var keys = {
            keys: userNames
        };

        usersDb.fetch(keys, function (err, body) {
            callback(err, groupId, body);
        });
    }

    function saveUsers (groupId, body, callback) {
        if (!body.rows) {
            return callback(new Error('Unknown error occurred while fetching users'));
        }

        var userDb = server.use('ret_users');

        async.forEach(users, saveUser, callback);

        function saveUser (user, userCallback) {

            var retUser = {
                firstName: user.firstName,
                lastName: user.lastName,
                groupId: groupId,
                expenses: []
            };

            var rev = findRev(body.rows, user.userName);
            if (rev) {
                retUser._rev = rev;
            }

            userDb.insert(retUser, user.userName, function (err, body) {
                if (err) {
                    userCallback(err);
                } else if (!body.ok) {
                    userCallback(new Error('Unknown error occurred'));
                } else {
                    userCallback();
                }
            });
        }
    }
};

function findRev (rows, userName) {
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].key === userName) {
            return rows[i].doc._rev;
        }
    }

    return null;
}
