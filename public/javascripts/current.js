App.peopleController = Ember.ArrayController.create({
    content: [],
    names: function () {
        var userNames = this.get('content').map(function (person) {
            return person.name;
        });

        return userNames;
    }.property('content.@each.name'),

    userNames: function () {
        var userNames = this.get('content').map(function (person) {
            return person.userName;
        });

        return userNames;
    }.property('content.@each.userName'),

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

    peopleChanged: drawGraph.observes('content.@each.paid'),

    addExpense: function (userName, expense) {
        var user = this.get('content').findProperty('userName', userName);
        if (user) {
            user.get('expenses').pushObject(expense);
        }
    }
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
    userName: null,
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
        /*TODO: Find out what is going wrong here
        optionLabelPathBinding: 'content.name',
        optionValuePathBinding: 'content.key',
        contentBinding: 'App.peopleController.content',*/

        contentBinding: 'App.peopleController.userNames',

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
            var payer = App.expenseFormController.get('user');
            var expense = {
                timeStamp: new Date(),
                amount: parseFloat(App.expenseFormController.get('amount')),
                comment: App.expenseFormController.get('comment')
            };

            var validControl = {
                payer: Boolean(payer),
                amount: !isNaN(expense.amount) && expense.amount > 0,
                comment: expense.comment
            };

            if (validControl.payer && validControl.amount && validControl.comment) {
                var ajaxData = {
                    amount: expense.amount,
                    comment: expense.comment
                };

                jQuery.getJSON('/current/add/' + payer, ajaxData, function(post) {
                    if (post && post.status === 200 && !post.error) {
                        App.formAlertController.set('errors', null);
                        App.peopleController.addExpense(payer, expense);
                        App.expenseFormController.reset();
                    } else if (post && post.error) {
                        App.formAlertController.set('errors', [post.error]);
                    }
                });
            } else {
                var errors = [];
                if (!validControl.payer) {
                    errors.push('Invalid user selected');
                }

                if (!validControl.amount) {
                    errors.push('Invalid amount entered');
                }

                if (!validControl.comment) {
                    errors.push('Please enter a comment');
                }

                App.formAlertController.set('errors', errors);
            }
        }
    })
});

App.formAlertController = Ember.Object.create({
    errors: null
});

App.formAlertView = Ember.View.extend({
   attributeBindings: ['hasNoErrors:hidden'],
   hasNoErrors: function () {
       var errors = this.get('errors');
       return Boolean(!errors || errors.length === 0);
   }.property('errors'),

   errorsBinding: 'App.formAlertController.errors'
});

$(document).ready(function() {
    jQuery.getJSON('/current', function(post) {
        var emberPeople = post.map(function (person) {
           return App.personController.create(person);
        });
        App.peopleController.set('content', emberPeople);
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
