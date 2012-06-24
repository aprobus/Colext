var prompt = require('prompt');
var inspect = require('util').inspect;
var dbSetup = require('../lib/dbSetup');

var groupSchema = {
    properties: {
        name: {
            description: 'Enter a group name',
            required: false
        }
    }
};

var userSchema = {
    properties: {
        userName: {
            description: 'Enter a unique userName',
            pattern: /^[\S]+$/,
            message: 'Cannot contain any spaces',
            required: true
        },

        firstName: {
            description: 'Enter user\'s first name',
            pattern: /^[\S]+$/,
            message: 'Cannot contain any spaces',
            required: true
        },

        lastName: {
            description: 'Enter user\'s last name',
            pattern: /^[\S]+$/,
            message: 'Cannot contain any spaces',
            required: true
        }
    }
};

var enterAnotherUserSchema = {
    properties: {
        answer: {
            description: 'Enter another user? (y/n)',
            pattern: /^(y|n)$/,
            message: 'Enter "y" for yes, and "n" for no',
            required: true
        }
    }
};

var group = {};
var users = [];

prompt.start();

prompt.get(groupSchema, onGroupEntered);

function onGroupEntered (err, groupEntered) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    group = groupEntered;
    prompt.get(userSchema, onUserEntered);
}

function onUserEntered (err, user) {
    if (err) {
        Console.log('Error occurred, please enter a valid user');
        prompt.get(userSchema, onUserEntered);
        return;
    }

    users.push(user);
    prompt.get(enterAnotherUserSchema, onAnswerEnterMore);
}

function onAnswerEnterMore (err, response) {
    if (err) {
        console.log('Error occurred: ' + err);
    } else if (response.answer === 'y') {
        prompt.get(userSchema, onUserEntered);
    } else {
        save();
    }
}

function save () {
    dbSetup.saveUsersAndGroup (users, group, function (err) {
       if (err) {
           console.error('Error occurred while saving: ');
           console.error(inspect(err));
       } else {
           console.log('Users/Group successfully saved');
       }
    });
}
