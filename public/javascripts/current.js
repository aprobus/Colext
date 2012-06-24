window.App = Ember.Application.create();

//------------------------------- Data Models -------------------------------

/**
 * Data model of a Ret user
 * @type {*}
 */
App.personModel = Ember.Object.extend({
    firstName: null,
    lastName: null,
    userName: null,
    expenses: [],

    name: function () {
        return this.get('firstName') + ' ' + this.get('lastName');
    }.property('firstName', 'lastName'),

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

//------------------------------- Controllers -------------------------------

/*
    Controls the list of users
 */
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

    expenses: function () {
        var people = App.peopleController.get('content');

        var expenses = [];
        for (var i = 0; i < people.length; i++) {
            var personExpenses = getUpdatedExpensesForPerson(people[i]);
            expenses = expenses.concat(personExpenses);
        }

        var sortedExpenses = expenses.sort(function (expense1, expense2) {
            if (expense1.timeStamp > expense2.timeStamp) {
                return -1;
            }
            if (expense1.timeStamp < expense2.timeStamp) {
                return 1;
            }

            return 0;
        });

        return sortedExpenses;

        function getUpdatedExpensesForPerson (person) {
            var personalExpenses = person.get('expenses');
            var updatedExpenses = personalExpenses.map(function (personalExpense) {
                var abbrevComment = personalExpense.comment;
                if (abbrevComment.length > 20) {
                    abbrevComment = abbrevComment.substring(0, 20) + '...';
                }

                var updatedExpense = Ember.Object.create({
                    timeStamp: new Date(personalExpense.timeStamp),
                    timeStampString: function () {
                        var timeStamp = this.get('timeStamp');
                        var day = timeStamp.getDate();
                        var month = timeStamp.getMonth() + 1;
                        var year = timeStamp.getFullYear().toString().substring(2);

                        return month + '/' + day + '/' + year;
                    }.property('timeStamp'),
                    user: person.get('name'),
                    amount: personalExpense.amount.toFixed(2),
                    comment: abbrevComment,
                    title: personalExpense.comment,
                    fullComment: personalExpense.comment
                }) ;

                return updatedExpense;
            });

            return updatedExpenses;
        }
    }.property('content.@each.paid'),

    onExpensesChanged: function () {
        var content = this.get('content');
        var expensePerPerson = this.get('totalPaid') / content.length;

        for (var i = 0; i < content.length; i++) {
            var person = content[i];
            var owe = person.get('paid') - expensePerPerson;
            person.set('owe', owe);
        }

        drawGraph();
    }.observes('content.@each.paid'),

    addExpense: function (formData) {
        var user = this.get('content').findProperty('userName', formData.payer);
        if (user) {
            user.get('expenses').pushObject(formData.expense);
        }
    }
});

/*
  Represents the data used when adding an expense
 */
App.expenseFormController = Ember.Object.create({
    user: null,
    amount: null,
    comment: null,

    reset: function () {
        this.set('user', null);
        this.set('amount', null);
        this.set('comment', null);
    },

    getFormData: function () {
        var expense = {
          amount: parseFloat(this.get('amount')),
          comment: this.get('comment'),
          timeStamp: new Date()
        };

        var formData = {
            payer: this.get('user') ,
            expense: expense
        };

        return formData;
    },

    getErrors: function () {
        var formData = this.getFormData();
        var errors = [];

        if (!formData.payer) {
            errors.push('Must specify a payer');
        }

        if (isNaN(formData.expense.amount)) {
            errors.push('Amount is not a number!');
        } else if (formData.expense.amount <= 0) {
            errors.push('Amount paid must be positive');
        }

        if (!formData.expense.comment) {
            errors.push('Add a brief comment on the expense');
        }

        return errors;
    }
});

/*
    List of current errors
 */
App.formAlertController = Ember.Object.create({
    errors: null
});

/*
    Controls the paging data
 */
App.pageController = Ember.Object.create({
    currentPage: 0,

    hasOlderPage: function () {
        var currentPage = this.get('currentPage');
        var expenses = App.peopleController.get('expenses').length;
        var totalPages = Math.ceil(expenses / 10.0);

        return (currentPage + 1) < totalPages;
    }.property('App.peopleController.content.@each.expenses.@each', 'currentPage'),

    hasNewerPage: function () {
        var currentPage = this.get('currentPage');

        return currentPage > 0;
    }.property('App.peopleController.content.@each.expenses.@each', 'currentPage'),

    viewOlder: function () {
        if (this.get('hasOlderPage')) {
            console.log('has older page');
            var currentPage = this.get('currentPage');
            this.set('currentPage', currentPage + 1);
        } else {
            console.log('does not have older page');
        }
    },

    viewNewer: function () {
        if (this.get('hasNewerPage')) {
            console.log('has newer page');
            var currentPage = this.get('currentPage');
            this.set('currentPage', currentPage - 1);
        } else {
            console.log('does not have newer page');
        }
    },

    expensesForPage: function () {
        var currentPage = this.get('currentPage');
        var expenses = App.peopleController.get('expenses');
        var maxIndex = currentPage * 10 + 10;

        if (maxIndex > expenses.length) {
            maxIndex = expenses.length;
        }

        return expenses.slice(currentPage * 10, maxIndex);
    }.property('currentPage', 'App.peopleController.expenses')
});

//------------------------------- Views -------------------------------

/*
    View of the total amounts that people have paid/owe
 */
App.summaryTableView = Ember.View.extend({
    peopleBinding: 'App.peopleController.content'
});

/*
    View of the most recent expenses
 */
App.expenseTableView = Ember.View.extend({
    contentBinding: 'App.pageController.expensesForPage'
});

/*
    View of form to add expenses
 */
App.expenseFormView = Ember.View.extend({
    attributeBindings: ['action'],
    action: '#'
});

/*
    Required components of the expenseFormView
 */
App.expenseFormControls = Ember.Object.create({
    /*
        View to select which user to add expenses to
     */
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

    /*
        View to add a comment about the expense
     */
    commentView: Ember.TextField.extend({
        attributeBindings: ['placeHolder'],
        placeHolder: 'Comment',

        valueBinding: 'App.expenseFormController.comment'
    }),

    /*
        View to specify how much money was spent
     */
    amountView: Ember.TextField.extend({
        attributeBindings: ['type', 'style'],
        type: 'number',

        classNameBindings: ['isInvalid:error'],
        isInvalid: false,

        valueBinding: 'App.expenseFormController.amount'
    }),

    /*
        View to submit the expense
     */
    submitView: Ember.Button.extend({
        attributeBindings: ['type', 'value'],
        value: 'Submit',
        type: 'submit',

        click: function (event) {
            event.preventDefault();

            var formErrors = App.expenseFormController.getErrors();
            if (formErrors && formErrors.length > 0) {
                App.formAlertController.set('errors', formErrors);
                return;
            }

            var formData = App.expenseFormController.getFormData();

            var ajaxData = {
                amount: formData.expense.amount,
                comment: formData.expense.comment
            };

            jQuery.getJSON('/current/add/' + formData.payer, ajaxData, function(reply) {
                if (reply && reply.errors && reply.errors.length > 0) {
                    App.formAlertController.set('errors', reply.errors);
                } else if (reply && reply.status === 200) {
                    App.formAlertController.set('errors', null);
                    App.peopleController.addExpense(formData);
                    App.expenseFormController.reset();
                } else {
                    App.formAlertController.set('errors', ['Unknown response from server']);
                }
            });
        }
    }),

    /*
        View to clear the current expense form data
     */
    cancelView: Ember.Button.extend({
        attributeBindings: ['value'],
        value: 'Cancel',

        click: function (event) {
            event.preventDefault();

            App.formAlertController.set('errors', null);
            App.expenseFormController.reset();
        }
    })
});

/*
    View of current errors
 */
App.formAlertView = Ember.View.extend({
    attributeBindings: ['hasNoErrors:hidden'],
    hasNoErrors: function () {
        var errors = this.get('errors');
        return Boolean(!errors || errors.length === 0);
    }.property('errors'),

    errorsBinding: 'App.formAlertController.errors'
});

/*
    View of the pager arrows, used to view older/newer expenses
 */
App.pagerViews = Ember.Object.create({
    older: Ember.View.extend({
        classNameBindings: ['hasNoOlder:disabled'],
        hasNoOlder: function () {
            return !App.pageController.get('hasOlderPage');
        }.property('App.pageController.hasOlderPage'),

        click: function (event) {
            event.preventDefault();
            App.pageController.viewOlder();
        }
    }),

    newer: Ember.View.extend({
        classNameBindings: ['hasNoNewer:disabled'],
        hasNoNewer: function () {
            return !App.pageController.get('hasNewerPage');
        }.property('App.pageController.hasNewerPage'),

        click: function (event) {
            event.preventDefault();
            App.pageController.viewNewer();
        }
    })
});

//------------------------------- Other -------------------------------

$(document).ready(function() {
    jQuery.getJSON('/current', function(reply) {
        if (reply && reply.error) {
            App.formAlertController.set('errors', [reply.error && reply.error.description]);
        } else if (reply && reply.users) {
            var emberPeople = reply.users.map(function (person) {
                return App.personModel.create(person);
            });
            App.peopleController.set('content', emberPeople);
        } else {
            App.formAlertController.set('errors', ['Unknown error while connecting to server']);
        }
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
