exports.index = function(req, res){
    var people = [];
    people[0] = {
        name: 'Aaron',
        expenses: [{
            timeStamp: new Date(2012, 5, 12),
            amount: 34.93,
            comment: 'Electric bill'
        }, {
            timeStamp: new Date(2012, 5, 11),
            amount: 15.07,
            comment: 'Gas bill'
        }]
    };

    people[1] = {
        name: 'Andy',
        expenses: [{
            timeStamp: new Date(2012, 5, 10),
            amount: 10.00,
            comment: 'Groceries'
        }]
    };

    people[2] = {
        name: 'Barry',
        expenses: [{
            timeStamp: new Date(2012, 5, 9),
            amount: 60.00,
            comment: 'Groceries'
        }]
    };

    res.json(people, 200);
};
