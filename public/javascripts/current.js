window.App = Ember.Application.create();

//------------------------------- Data Models -------------------------------

/*
    Data model of a person
 */
App.personModel = Ember.Object.extend({
    firstName: null,
    lastName: null,
    userName: null,
    expenses: [],

    fullName: function () {
        return this.get('firstName') + ' ' + this.get('lastName');
    }.property('firstName', 'lastName'),

    expensesForPayout: function () {
        var expenses = this.get('expenses');
        var start = App.payoutController.get('start');
        var end = App.payoutController.get('end');

        if (!start && !end) {
            return expenses;
        } else if (start && !end) {
            return expenses.filter(expenseAfterDate);
        } else if (!start && end) {
            return expenses.filter(expenseBeforeDate);
        } else {
            return expenses.filter(expenseBetweenDate);
        }

        function expenseAfterDate (expense) {
            return expense.timeStamp > start;
        }

        function expenseBeforeDate (expense) {
            return expense.timeStamp < end;
        }

        function expenseBetweenDate (expense) {
            return expenseAfterDate(expense) && expenseBeforeDate(expense);
        }
    }.property('expenses.@each.paid', 'App.payoutController.start', 'App.payoutController.end'),

    paidForPayout: function() {
        var totalExpenses = 0.0;
        var expenses = this.get('expensesForPayout');
        for (var i = 0; i < expenses.length; i++) {
            totalExpenses += expenses[i].get('amount');
        }

        return totalExpenses;
    }.property('expensesForPayout.@each.amount'),

    paidForPayoutString: function () {
        return this.get('paidForPayout').toFixed(2);
    }.property('paidForPayout'),

    oweForPayout: function () {
        var totalPaid = App.payoutController.get('totalPaid');
        var numPeople = App.peopleController.get('numPeople');
        var individualShare = totalPaid / numPeople;

        var userPaid = this.get('paidForPayout');

        return userPaid - individualShare;
    }.property('App.payoutController.totalPaid', 'App.peopleController.numPeople', 'paidForPayout'),

    absOweForPayoutString: function () {
        var owedString = Math.abs(this.get('oweForPayout')).toFixed(2);
        return owedString;
    }.property('oweForPayout'),

    inDebtForPayout: function () {
        return this.get('oweForPayout') < 0;
    }.property('oweForPayout'),

    addExpense: function (expense) {
        expense.set('payer', this);
        this.get('expenses').pushObject(expense);
    }
});

App.expenseModel = Ember.Object.extend({
    payer: null,
    timeStamp: null,
    amount: 0.0,
    comment: null,

    timeStampString: function () {
        var timeStamp = this.get('timeStamp');
        var timeStampDate = new Date(timeStamp);
        var day = timeStampDate.getDate();
        var month = timeStampDate.getMonth() + 1;
        var year = timeStampDate.getFullYear().toString().substring(2);

        return month + '/' + day + '/' + year;
    }.property('timeStamp'),

    payerString: function () {
        return this.get('payer').get('fullName');
    }.property('payer'),

    amountString: function () {
        return this.get('amount').toFixed(2);
    }.property('amount')
});

//------------------------------- Controllers -------------------------------

/*
    Controls the list of users
 */
App.peopleController = Ember.ArrayController.create({
    content: [],

    numPeople: function () {
        return this.get('content').length;
    }.property('content.@each')
});

/*
    Everything that is related to this payout
 */
App.payoutController = Ember.Object.create({
    payouts: [],
    start: null,
    end: null,

    lastPayoutChanged: function () {
        var content = this.get('payouts');
        if (!content || content.length === 0) {
            return;
        }

        this.set('start', content[content.length - 1]);
    }.observes('payouts.@each'),

    totalPaid: function () {
        var people = App.peopleController.get('content');

        var total = 0.0;
        for (var i = 0; i < people.length; i++) {
            total += people[i].get('paidForPayout');
        }

        return total;
    }.property('App.peopleController.content.@each.paidForPayout'),

    addPayout: function () {
        var self = this;
        jQuery.getJSON('/payout', function (reply) {
            if (reply && reply.ok) {
                self.get('payouts').pushObject(new Date().getTime());
            }
        });
    },

    expensesForPayout: function () {
        var people = App.peopleController.get('content');
        var expenses = [];

        for (var i = 0; i < people.length; i++) {
            expenses = expenses.concat(people[i].get('expensesForPayout'));
        }

        var sortedExpenses = expenses.sort(function (expense1, expense2) {
            var timeStamp1 = new Date(expense1.get('timeStamp'));
            var timeStamp2 = new Date(expense2.get('timeStamp'));

            if (timeStamp1 > timeStamp2) {
                return -1;
            } else if (timeStamp1 < timeStamp2) {
                return 1;
            } else {
                return 0;
            }
        });

        return sortedExpenses;
    }.property('App.peopleController.content.@each.expensesForPayout.@each'),

    onExpensesForPayoutChanged: drawGraph.observes('expensesForPayout.@each')
});

/*
  Represents the data used when adding an expense
 */
App.expenseFormController = Ember.Object.create({
    user: null,
    amount: null,
    comment: null,

    reset: function () {
        App.formAlertController.set('errors', null);

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
            payer: this.get('user'),
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
    },

    submit: function () {
        var formErrors = this.getErrors();
        if (formErrors && formErrors.length > 0) {
            App.formAlertController.set('errors', formErrors);
            return;
        }

        var formData = this.getFormData();
        var payer = formData.payer.get('userName');

        var expensePartial = {
            amount: formData.expense.amount,
            comment: formData.expense.comment
        };

        jQuery.getJSON('/current/add/' + payer, expensePartial, function(reply) {
            if (reply && reply.errors && reply.errors.length > 0) {
                App.formAlertController.set('errors', reply.errors);
            } else if (reply && reply.status === 200) {
                App.formAlertController.set('errors', null);
                addExpenseForUser(payer, expensePartial);
                App.expenseFormController.reset();
            } else {
                App.formAlertController.set('errors', ['Unknown response from server']);
            }
        });
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
        var expenses = App.payoutController.get('expensesForPayout').length;
        var totalPages = Math.ceil(expenses / 10.0);

        return (currentPage + 1) < totalPages;
    }.property('App.payoutController.expensesForPayout.@each', 'currentPage'),

    hasNewerPage: function () {
        var currentPage = this.get('currentPage');

        return currentPage > 0;
    }.property('App.payoutController.expensesForPayout.@each', 'currentPage'),

    viewOlder: function () {
        if (this.get('hasOlderPage')) {
            var currentPage = this.get('currentPage');
            this.set('currentPage', currentPage + 1);
        }
    },

    viewNewer: function () {
        if (this.get('hasNewerPage')) {
            var currentPage = this.get('currentPage');
            this.set('currentPage', currentPage - 1);
        }
    },

    expensesForPage: function () {
        var currentPage = this.get('currentPage');
        var expenses = App.payoutController.get('expensesForPayout');
        var maxIndex = currentPage * 10 + 10;

        if (maxIndex > expenses.length) {
            maxIndex = expenses.length;
        }

        return expenses.slice(currentPage * 10, maxIndex);
    }.property('currentPage', 'App.payoutController.expensesForPayout.@each')
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
        optionLabelPath: 'content.fullName',
        optionValuePath: 'content.userName',
        contentBinding: 'App.peopleController.content',

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
            App.expenseFormController.submit();
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

/*
    View for adding new payouts
 */
App.payoutView = Ember.View.extend({
    click: function (event) {
        event.preventDefault();
        App.payoutController.addPayout();
    }
});

//------------------------------- Other -------------------------------

$(document).ready(function() {
    jQuery.getJSON('/current', function(reply) {
        if (reply && reply.error) {
            App.formAlertController.set('errors', [reply.error && reply.error.description]);
        } else if (reply && reply.users) {
            var emberPeople = setupUsersFromJson(reply.users);
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
        var totalExpenses = person.get('paidForPayout');

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
            return people[index].get('fullName');
        } else {
            return '';
        }
    }
}

function setupUsersFromJson (usersJson) {
    var emberUsers = usersJson.map(function (userJson) {
        var user = App.personModel.create();
        user.set('firstName', userJson.firstName);
        user.set('lastName', userJson.lastName);
        user.set('userName', userJson.userName);

        var expenses = [];
        for (var i = 0; i < userJson.expenses.length; i++) {
            var expense = App.expenseModel.create(userJson.expenses[i]);
            expense.set('payer', user);
            expenses.push(expense);
        }

        user.set('expenses', expenses);
        return user;
    });

    return emberUsers;
}

function addExpenseForUser (userName, expense) {
    var user = App.peopleController.findProperty('userName', userName);
    expense.timeStamp = new Date();
    expense.payer = user;
    var emberExpense = App.expenseModel.create(expense);
    user.get('expenses').pushObject(emberExpense);
}
