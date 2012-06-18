App.peopleController = Ember.ArrayController.create({
    content: [],
    names: function () {
        var userNames = this.get('content').map(function (person) {
            return person.name;
        });

        return userNames;
    }.property('content.@each'),

    totalPaid: function () {
        var total = 0.0;

        var people = this.get('content');
        for (var i = 0; i < people.length; i++) {
            total += people[i].get('paid');
        }

        return total;
    }.property('content.@each'),

    numPeople: function () {
        return this.get('content').length;
    }.property('content.@each'),

    peopleChanged: drawGraph.observes('content.@each')
});

App.peopleController.addObserver('content.@each.expenses', function () {
    var content = this.get('content');
    var expensePerPerson = this.get('totalPaid') / content.length;

    for (var i = 0; i < content.length; i++) {
        var person = content[i];
        var owe = person.get('paid') - expensePerPerson;
        person.set('owe', owe);
    }
});

App.personController = Ember.Object.extend({
    name: null,
    expenses: null,

    paid: function() {
        var totalExpenses = 0.0;
        var expenses = this.get('expenses');
        for (var i = 0; i < expenses.length; i++) {
            totalExpenses += expenses[i].amount;
        }

        return totalExpenses;
    }.property('expenses'),

    owe: 0.0,

    absOwe: function () {
        return Math.abs(this.get('owe'));
    }.property('owe'),

    inDebt: function () {
        return this.get('owe') < 0;
    }.property('owe')
});

$(document).ready(function() {
    jQuery.getJSON('/current', function(post) {
        var emberPeople = post.map(function (person) {
           return App.personController.create(person);
        });
        App.peopleController.set('content', emberPeople);

        drawGraph(post);
    });
});


function drawGraph () {
    var people = App.peopleController.get('content');
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
