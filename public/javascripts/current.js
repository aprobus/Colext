window.App = Ember.Application.create();

//------------------------------- Data Models -------------------------------

/*
    Data model of a person
 */
App.personModel = Ember.Object.extend({
    firstName: null,
    lastName: null,
    userName: null,

    fullName: function () {
        return this.get('firstName') + ' ' + this.get('lastName');
    }.property('firstName', 'lastName'),

    expensesForPayout: function () {
        var expenses = App.displayableExpensesController.get('expensesForPayout');
        var userName = this.get('userName');

        var userExpenses = expenses.filter(function (expense) {
            return expense.get('payer').get('userName') === userName;
        });

        return userExpenses;
    }.property('App.displayableExpensesController.expensesForPayout.@each'),

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
        var totalPaid = App.displayableExpensesController.get('totalPaid');
        var numPeople = App.peopleController.get('numPeople');
        var individualShare = totalPaid / numPeople;

        var userPaid = this.get('paidForPayout');

        return userPaid - individualShare;
    }.property('App.displayableExpensesController.totalPaid',
        'App.peopleController.numPeople',
        'paidForPayout'),

    absOweForPayoutString: function () {
        var owedString = Math.abs(this.get('oweForPayout')).toFixed(2);
        return owedString;
    }.property('oweForPayout'),

    inDebtForPayout: function () {
        return this.get('oweForPayout') < 0;
    }.property('oweForPayout')
});

App.expenseModel = Ember.Object.extend({
    payer: null,
    timeStamp: null,
    amount: 0.0,
    comment: null,

    timeStampString: function () {
        var timeStamp = this.get('timeStamp');
        var momentDate = moment.unix(timeStamp);
        return shortDateFormat(momentDate);
    }.property('timeStamp'),

    payerString: function () {
        return this.get('payer').get('fullName');
    }.property('payer'),

    amountString: function () {
        return this.get('amount').toFixed(2);
    }.property('amount')
});

App.timeSpanModel = Ember.Object.extend({
    from: null,
    to: null,

    fromStringShort: function () {
        var from = this.get('from');

        if (from === Number.NEGATIVE_INFINITY) {
            return 'Start';
        }

        var fromDate = moment.unix(from);
        return shortDateFormat(fromDate);
    }.property('from'),

    toStringShort: function () {
        var to = this.get('to');

        if (to === Number.POSITIVE_INFINITY) {
            return 'Now';
        }

        var toDate = moment.unix(to);
        return shortDateFormat(toDate);
    }.property('to'),

    fromStringLong: function () {
        var from = this.get('from');

        if (from === Number.NEGATIVE_INFINITY) {
            return 'Start';
        }

        var fromDate = moment.unix(from);
        return longDateFormat(fromDate);
    }.property('from'),

    toStringLong: function () {
        var to = this.get('to');

        if (to === Number.POSITIVE_INFINITY) {
            return 'Now';
        }

        var toDate = moment.unix(to);
        return longDateFormat(toDate);
    }.property('to')
});

//------------------------------- Controllers -------------------------------

/*
    Controls the list of users
 */
App.peopleController = Ember.ArrayController.create({
    content: [],

    addPerson: function (userName, firstName, lastName) {
        var person = App.personModel.create({
            userName: userName,
            firstName: firstName,
            lastName: lastName
        });

        this.get('content').pushObject(person);
    },

    setPeople: function (users) {
        var people = [];
        var person = null;

        for (var i = 0; i < users.length; i++) {
            person = App.personModel.create({
                userName: users[i].userName,
                firstName: users[i].firstName,
                lastName: users[i].lastName
            });

            people.push(person);
        }

        this.set('content', people);
    },

    numPeople: function () {
        return this.get('content').length;
    }.property('content.@each')
});

App.expensesController = Ember.ArrayController.create({
    content: [],

    addExpense: function (userName, amount, comment, timeStamp) {
        var payer = App.peopleController.get('content').findProperty('userName', userName);

        var expense = App.expenseModel.create({
            payer: payer,
            amount: amount,
            comment: comment,
            timeStamp: timeStamp || (new Date().getTime() / 1000)
        });

        this.get('content').pushObject(expense);
    },

    setExpenses: function (expenses) {
        var userExpenses = [];
        var payer = null;
        var expense = null;

        for (var i = 0; i < expenses.length; i++) {
            payer = App.peopleController.get('content').findProperty('userName', expenses[i].userName);

            expense = App.expenseModel.create({
                payer: payer,
                amount: expenses[i].amount,
                comment: expenses[i].comment,
                timeStamp: expenses[i].timeStamp || new Date().getTime()
            });

            userExpenses.push(expense);
        }

        this.set('content', userExpenses);
    }
});

/*
    Everything that is related to this payout
 */
App.payoutController = Ember.Object.create({
    payouts: [],

    addPayout: function () {
        var self = this;
        jQuery.getJSON('/payout', function (reply) {
            if (reply && reply.ok) {
                self.get('payouts').pushObject(new Date().getTime() / 1000);
                App.timeSpanController.setSelectedToNewest();
            }
        });
    }
});

App.timeSpanController = Ember.Object.create({
    selectedTimeSpan: null,

    selectedOrDefault: function () {
        var selected = this.get('selectedTimeSpan');
        if (selected) {
            return selected;
        } else {
            var timeSpans = this.get('timeSpans');
            return timeSpans[0];
        }
    }.property('selectedTimeSpan', 'timeSpans'),

    timeSpans: function () {
        var payouts = App.payoutController.get('payouts').sort();

        if (payouts.length === 0) {
            var timeSpanAllTime = App.timeSpanModel.create({
                from: Number.NEGATIVE_INFINITY,
                to: Number.POSITIVE_INFINITY
            });

            return [timeSpanAllTime];
        }

        var payoutTimeSpans = [];
        payoutTimeSpans.push(App.timeSpanModel.create({
            from: Number.NEGATIVE_INFINITY,
            to: payouts[0]
        }));

        for (var i = 0; i < payouts.length - 1; i++) {
            payoutTimeSpans.push(App.timeSpanModel.create({
                from: payouts[i],
                to: payouts[i + 1]
            }));
        }

        payoutTimeSpans.push(App.timeSpanModel.create({
            from: payouts[payouts.length - 1],
            to: Number.POSITIVE_INFINITY
        }));

        return payoutTimeSpans.reverse();
    }.property('App.payoutController.payouts.@each'),

    setSelectedToNewest: function () {
        var timeSpans = this.get('timeSpans');
        this.set('selectedTimeSpan', timeSpans[0]);
    }
});

App.displayableExpensesController = Ember.Object.create({
    expensesForPayout: function () {
        var timeSpan = App.timeSpanController.get('selectedOrDefault');
        var startTime = timeSpan.get('from');
        var endTime = timeSpan.get('to');

        var allExpenses = App.expensesController.get('content');

        var payoutExpenses = allExpenses.filter(function (expense) {
           var timeStamp = expense.get('timeStamp');
            return (timeStamp > startTime) && (timeStamp < endTime);
        });

        var sortedExpenses = payoutExpenses.sort(function (expense1, expense2) {
            var timeStamp1 = expense1.get('timeStamp');
            var timeStamp2 = expense2.get('timeStamp');

            if (timeStamp1 > timeStamp2) {
                return -1;
            } else if (timeStamp1 < timeStamp2) {
                return 1;
            } else {
                return 0;
            }
        });

        return sortedExpenses;
    }.property('App.expensesController.@each', 'App.timeSpanController.selectedOrDefault'),

    totalPaid: function () {
        var expenses = this.get('expensesForPayout');
        var total = 0.0;

        for (var i = 0; i < expenses.length; i++) {
            total += expenses[i].get('amount')
        }

        return total;
    }.property('expensesForPayout.@each.amount'),

    onExpensesForPayoutChanged: drawGraph.observes('expensesForPayout.@each')
});

/*
  Represents the data used when adding an expense
 */
App.expenseFormController = Ember.Object.create({
    amount: null,
    comment: null,

    reset: function () {
        App.formAlertController.set('errors', null);

        this.set('amount', null);
        this.set('comment', null);
    },

    getFormData: function () {
        var expense = {
          amount: parseFloat(this.get('amount')),
          comment: this.get('comment'),
          timeStamp: new Date()
        };

        var userName = $.cookie('userName');

        var formData = {
            payer: userName,
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

        var expensePartial = {
            amount: formData.expense.amount,
            comment: formData.expense.comment
        };

        jQuery.getJSON('/current/add/' + formData.payer, expensePartial, function(reply) {
            if (reply && reply.errors && reply.errors.length > 0) {
                App.formAlertController.set('errors', reply.errors);
            } else if (reply && reply.ok) {
                App.formAlertController.set('errors', null);
                App.expensesController.addExpense(formData.payer, expensePartial.amount, expensePartial.comment);
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
        var expenses = App.displayableExpensesController.get('expensesForPayout').length;
        var totalPages = Math.ceil(expenses / 10.0);

        return (currentPage + 1) < totalPages;
    }.property('App.displayableExpensesController.expensesForPayout.@each', 'currentPage'),

    hasNewerPage: function () {
        var currentPage = this.get('currentPage');

        return currentPage > 0;
    }.property('currentPage'),

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
        var expenses = App.displayableExpensesController.get('expensesForPayout');
        var maxIndex = currentPage * 10 + 10;

        if (maxIndex > expenses.length) {
            maxIndex = expenses.length;
        }

        return expenses.slice(currentPage * 10, maxIndex);
    }.property('currentPage', 'App.displayableExpensesController.expensesForPayout.@each')
});

App.loginController = Ember.Object.create({
    userName: null,
    password: null,
    loggedIn: false,

    login: function () {
        var self = this;
        var userName = this.get('userName');
        var password = this.get('password');

        var loginData = {
            userName: userName,
            password: password
        };

        $.post('/login', loginData, onPostComplete, 'json');

        function onPostComplete (responseData) {
            if (responseData && responseData.ok) {
                self.set('loggedIn', true);
                self.set('password', null);
            }
        }
    },

    logout: function () {
        var self = this;
        $.getJSON('/logout', function (reply) {
            self.set('loggedIn', false);
        });
    },

    loggedInChanged: function () {
        var loggedIn = this.get('loggedIn');

        if (loggedIn) {
            this.set('userName', $.cookie('userName'));
            getAllData();
        } else {
            $.cookie('authorization', null);
            App.peopleController.set('content', []);
            App.expensesController.set('content', []);
        }
    }.observes('loggedIn')
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
        attributeBindings: ['type', 'value', 'hide:disabled'],
        value: 'Submit',
        type: 'submit',
        hide: function () {
            return !App.loginController.get('loggedIn');
        }.property('App.loginController.loggedIn'),

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

App.timeSpanView = Ember.View.extend({
    content: null, //To be set to a timeSpan

    select: function () {
        var timeSpan = this.get('content');
        var from = timeSpan.get('from') || Number.NEGATIVE_INFINITY;
        //App.payoutController.setPayout(from);
        App.timeSpanController.set('selectedTimeSpan', timeSpan);
    }
});

App.loginControls = Ember.Object.create({
    userNameView: Ember.TextField.extend({
        attributeBindings: ['placeholder'],
        placeholder: 'userName',

        valueBinding: 'App.loginController.userName'
    }),

    passwordView: Ember.TextField.extend({
        attributeBindings: ['placeholder'],
        placeholder: 'Password',

        type: 'password',
        valueBinding: 'App.loginController.password'
    }),

    submitView: Ember.View.extend({
        attributeBindings: ['type', 'value'],
        type: 'submit',
        value: 'Login',

        click: function (event) {
            event.preventDefault();
            App.loginController.login();
        }
    }),

    logoutView: Ember.View.extend({
        attributeBindings: ['type', 'value'],
        type: 'button',
        value: 'Log Out',

        click: function (event) {
            event.preventDefault();
            App.loginController.logout();
        }
    })
});

//------------------------------- Other -------------------------------

$(document).ready(function() {
    var hasAuthorization = Boolean($.cookie('authorization'));
    var hasUserName = Boolean($.cookie('userName'));

    if (hasAuthorization && hasUserName) {
        App.loginController.set('loggedIn', true);
    }
});

function getAllData () {
    jQuery.getJSON('/current', function(reply) {
        if (reply && reply.error) {
            App.formAlertController.set('errors', [reply.error && reply.error.description]);
            return;
        }

        if (reply && reply.users) {
            App.peopleController.setPeople(reply.users);
        }

        if (reply && reply.expenses) {
            App.expensesController.setExpenses(reply.expenses);
        }
    });
}

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

function shortDateFormat (momentDate) {
    return momentDate.format('M/D/YY');
}

function longDateFormat (momentDate) {
    return momentDate.format('MMM Do, YYYY');
}
