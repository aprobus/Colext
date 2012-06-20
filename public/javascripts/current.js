App.peopleController = Ember.ArrayController.create({
    content: [],
    names: function () {
        var userNames = this.get('content').map(function (person) {
            return person.name;
        });

        return userNames;
    }.property('content.@each.name'),

    totalPaid: function () {
        var total = 0.0;

        var people = this.get('content');
        for (var i = 0; i < people.length; i++) {
            total += people[i].get('paid');
        }

        return total;
    }.property('content.@each.paid'),

    numPeople: function () {
        return this.get('content').length;
    }.property('content.@each'),

    peopleChanged: drawGraph.observes('content.@each.paid')
});

App.peopleController.addObserver('@each.paid', function () {
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

App.expenseTableView = Ember.View.extend({
   content: function () {
       var people = App.peopleController.get('content');

       var expenses = [];
       for (var i = 0; i < people.length; i++) {
           var personExpenses = getUpdatedExpensesForPerson(people[i]);
           expenses = expenses.concat(personExpenses);
       }

       var sortedExpenses = expenses.sort(function (expense1, expense2) {
           if (expense1.timeStamp > expense2.timeStamp) return -1;
           if (expense1.timeStamp < expense2.timeStamp) return 1;
           return 0;
       });

       return sortedExpenses;

       function getUpdatedExpensesForPerson (person) {
           var personalExpenses = person.get('expenses');
           var updatedExpenses = personalExpenses.map(function (personalExpense) {
              var updatedExpense = Ember.Object.create({
                  timeStamp: new Date(personalExpense.timeStamp),
                  timeStampString: function () {
                      var timeStamp = this.get('timeStamp');
                      var day = timeStamp.getDate();
                      var month = timeStamp.getMonth() + 1;
                      var year = timeStamp.getFullYear().toString().substring(2);

                      return month + '/' + day + '/' + year;
                  }.property('timeStamp'),
                  user: person.name,
                  amount: personalExpense.amount.toFixed(2),
                  comment: personalExpense.comment
              }) ;

               return updatedExpense;
           });

           return updatedExpenses;
       }
   }.property('App.peopleController.content.@each.paid')
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
    comment: null,

    reset: function () {
        this.set('user', null);
        this.set('amount', null);
        this.set('comment', null);
    }
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

        classNameBindings: ['isInvalid:error'],
        isInvalid: false,

        valueBinding: 'App.expenseFormController.amount'
    }),

    submitView: Ember.Button.extend({
        attributeBindings: ['type', 'value'],
        value: 'Submit',
        type: 'submit',

        click: function (event) {
            var expense = {
                timeStamp: new Date(),
                amount: parseFloat(App.expenseFormController.get('amount')),
                comment: App.expenseFormController.get('comment')
            };

            var people = App.peopleController.get('content');
            var personWhoPaid = people.findProperty('name', App.expenseFormController.get('user'));
            if (personWhoPaid && !isNaN(expense.amount) && expense.comment) {
                personWhoPaid.get('expenses').pushObject(expense);

                App.expenseFormController.reset();
            } else {
                App.expenseForm.amountView.set('isInvalid', true);
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
