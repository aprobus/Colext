Users = Ember.Object.extend({
    people: null,
    names: function () {
        var userNames = this.get('people').map(function (person) {
            return person.name;
        });

        return userNames;
    }.property('people'),

    peopleChanged: drawGraph.observes('people')
});

Person = Ember.Object.extend({
    name: null,
    expenses: null,

    paid: function() {
        var totalExpenses = 0.0;
        for (var i = 0; i < this.get('expenses').length; i++) {
            totalExpenses += this.get('expenses')[i].amount;
        }

        return totalExpenses;
    }.property('expenses')
});

App.users = Users.create({
    people:[]
});

$(document).ready(function() {
    jQuery.getJSON('/current', function(post) {


        var emberPeople = post.map(function (person) {
           return Person.create(person);
        });

        App.users.set('people', emberPeople);

        drawGraph(post);
    });
});


function drawGraph () {
    var people = App.users.get('people');
    var container = document.getElementById("expenseGraphContainer");

    var expensesPerPerson = people.map(function (person, index) {
        var totalExpenses = person.get('paid');

        return [[index, totalExpenses]];
    });

    var options = {
        bars: {
            show: true,
            horizontal: false,
            barWidth:.5
        },

        xaxis: {
            tickFormatter: formatXAxis
        },

        yaxis: {
            min: 0
        }
    };

    var graph = Flotr.draw(container, expensesPerPerson, options);

    function formatXAxis (x) {
        var index = parseFloat(x);

        if (index % 1 === 0) {
            return people[index].get('name');
        } else {
            return '';
        }
    }
}
