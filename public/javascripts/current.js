App.peopleController = Ember.ArrayController.create({
    content: [],
    names: function () {
        var userNames = this.get('content').map(function (person) {
            return person.name;
        });

        return userNames;
    }.property('content.@each.expenses.@each'),

    totalPaid: function () {
        var total = 0.0;

        var people = this.get('content');
        for (var i = 0; i < people.length; i++) {
            total += people[i].get('paid');
        }

        return total;
    }.property('content.@each.expenses.@each'),

    numPeople: function () {
        return this.get('content').length;
    }.property('content.@each'),

    peopleChanged: drawGraph.observes('content.@each.expenses')
});

App.peopleController.addObserver('@each.expenses.@each', function () {
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
    expenses: [],

    paid: function() {
        var totalExpenses = 0.0;
        var expenses = this.get('expenses');
        for (var i = 0; i < expenses.length; i++) {
            totalExpenses += expenses[i].amount;
        }

        return totalExpenses;
    }.property('expenses.@each'),

    paidString: function () {
      return this.get('paid').toFixed(2);
    }.property('paid'),

    owe: 0.0,

    absOweString: function () {
        return Math.abs(this.get('owe').toFixed(2));
    }.property('owe'),

    inDebt: function () {
        return this.get('owe') < 0;
    }.property('owe')
});

App.summaryTableView = Ember.View.extend({
    peopleBinding: 'App.peopleController.content'
});

App.expenseFormView = Ember.View.extend({
    attributeBindings: ['action'],
    action: '#',

    namesBinding: 'App.peopleController.names',
    commentBinding: 'App.expenseForm.commentView.value',
    selectedUserBinding: 'App.expenseForm.nameSelectorView.selection',
    amountBinding: 'App.expenseForm.amountView.value'
});

App.expenseFormController = Ember.Object.create({
    user: null,
    amount: null,
    comment: null
});

App.expenseForm = Ember.Object.create({
    nameSelectorView: Ember.Select.extend({
        attributeBindings: ['name'],
        name: 'payer',
        selectionBinding: 'App.expenseFormController.user',
        contentBinding: 'App.peopleController.names',
        prompt: "Select a User"
    }),

    commentView: Ember.TextField.extend({
        attributeBindings: ['placeHolder'],
        placeHolder: 'Comment',
        valueBinding: 'App.expenseFormController.comment'
    }),

    amountView: Ember.TextField.extend({
        attributeBindings: ['type', 'style'],
        type: 'number',

        valueBinding: 'App.expenseFormController.amount'
    }),

    submitView: Ember.Button.extend({
        attributeBindings: ['type', 'value'],
        value: 'Submit',
        type: 'submit',

        click: function (event) {
            console.log('Amount: ' + App.expenseFormController.get('amount'));
            console.log('User: ' + App.expenseFormController.get('user'));
            console.log('Comment: ' + App.expenseFormController.get('comment'));

            var expense = {
                timeStamp: new Date(),
                amount: parseFloat(App.expenseFormController.get('amount')),
                comment: App.expenseFormController.get('comment')
            };

            var people = App.peopleController.get('content');
            var personWhoPaid = people.findProperty('name', App.expenseFormController.get('user'));
            if (personWhoPaid) {
                console.log('Total paid pre: ' + App.peopleController.get('totalPaid'));
                var expenses = personWhoPaid.get('expenses');
                //expenses.push(expense);
                personWhoPaid.set('expenses', [expense].concat(expenses));
                console.log('Total paid post: ' + App.peopleController.get('totalPaid'));
            }
        }
    })
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
