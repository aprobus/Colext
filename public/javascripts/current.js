window.App = Ember.Application.create();

//------------------------------- Data Models -------------------------------

/*
 Data model of a person
 */
App.personModel = Ember.Object.extend({
  firstName: null,
  lastName: null,
  email: null,

  fullName: function () {
    return this.get('firstName') + ' ' + this.get('lastName');
  }.property('firstName', 'lastName')
});

App.expenseModel = Ember.Object.extend({
  id: null,
  payer: null,
  timeStamp: null,
  amount: 0.0,
  comment: null,

  timeStampString: function () {
    var timeStamp = this.get('timeStamp');
    var momentDate = moment.unix(timeStamp);
    return shortDateFormat(momentDate);
  }.property('timeStamp'),

  timeStampStringLong: function () {
    var timeStamp = this.get('timeStamp');
    var momentDate = moment.unix(timeStamp);
    return longDateFormat(momentDate);
  }.property('timeStamp'),

  payerString: function () {
    return this.get('payer').get('fullName');
  }.property('payer'),

  amountString: function () {
    return '$' + this.get('amount').toFixed(2);
  }.property('amount')
});

App.timeSpanModel = Ember.Object.extend({
  from: Number.NEGATIVE_INFINITY,
  to: Number.POSITIVE_INFINITY,
  isSelected: false,

  expenses: function () {
    var startTime = this.get('from');
    var endTime = this.get('to');

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
  }.property('App.expensesController.@each', 'from', 'to'),

  totalPaid: function () {
    var expenses = this.get('expenses');
    var total = 0.0;

    for (var i = 0; i < expenses.length; i++) {
      total += expenses[i].get('amount')
    }

    return total;
  }.property('expenses.@each.amount'),

  totalPaidString: function () {
    var totalPaid = this.get('totalPaid');
    return totalPaid.toFixed(2);
  }.property('totalPaid'),

  isMostRecentTimeSpan: function () {
    return this.get('to') === Number.POSITIVE_INFINITY;
  }.property('to'),

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
  }.property('to'),

  fullQualifier: function () {
    var from = this.get('from');
    var to = this.get('to');

    if (from === Number.NEGATIVE_INFINITY && to === Number.POSITIVE_INFINITY) {
      return 'All Expenses';
    } else if (from === Number.NEGATIVE_INFINITY) {
      return 'Up to ' + this.get('toStringLong');
    } else if (to === Number.POSITIVE_INFINITY) {
      return 'After ' + this.get('fromStringLong');
    } else {
      return 'From ' + this.get('fromStringLong') + ' to ' + this.get('toStringLong');
    }
  }.property('from, to'),

  avgExpenseString: function () {
    var total = this.get('totalPaid');
    var numExpenses = this.get('expenses').length;

    if (numExpenses === 0) {
      return '$0.00';
    } else {
      return '$' + (total / numExpenses).toFixed(2);
    }
  }.property('totalPaid', 'expenses.@each')
});

App.userExpensesModel = Ember.Object.extend({
  payer: null,
  timeSpan: null,

  expenses: function () {
    var expenses = this.get('timeSpan').get('expenses');
    var email = this.get('payer').get('email');

    var userExpenses = expenses.filter(function (expense) {
      return expense.get('payer').get('email') === email;
    });

    return userExpenses;
  }.property('payer', 'timeSpan.expenses.@each.amount'),

  paidForPayout: function () {
    var totalExpenses = 0.0;
    var expenses = this.get('expenses');
    for (var i = 0; i < expenses.length; i++) {
      totalExpenses += expenses[i].get('amount');
    }

    return totalExpenses;
  }.property('expenses.@each.amount'),

  paidForPayoutString: function () {
    return this.get('paidForPayout').toFixed(2);
  }.property('paidForPayout'),

  oweForPayout: function () {
    var totalPaid = App.timeSpanController.get('selectedOrDefault').get('totalPaid');
    var numPeople = App.peopleController.get('numPeople');
    var individualShare = totalPaid / numPeople;

    var userPaid = this.get('paidForPayout');

    return userPaid - individualShare;
  }.property('timeSpan.totalPaid', 'App.peopleController.numPeople', 'paidForPayout'),

  absOweForPayoutString: function () {
    var owedString = Math.abs(this.get('oweForPayout')).toFixed(2);
    return owedString;
  }.property('oweForPayout'),

  inDebtForPayout: function () {
    return this.get('oweForPayout') < 0;
  }.property('oweForPayout')
});

//------------------------------- Controllers -------------------------------

/*
 Controls the list of users
 */
App.peopleController = Ember.ArrayController.create({
  content: [],

  addPerson: function (email, firstName, lastName) {
    var person = App.personModel.create({
      email: email,
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
        email: users[i].email,
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

  addExpense: function (id, email, amount, comment, timeStamp) {
    var payer = App.peopleController.get('content').findProperty('email', email);

    var expense = App.expenseModel.create({
      id: id,
      payer: payer,
      amount: amount,
      comment: comment,
      timeStamp: timeStamp || (new Date().getTime() / 1000)
    });

    this.get('content').pushObject(expense);
  },

  //TODO: Ajax calls for adding/removing expenses should not be in different locations
  removeExpense: function (id) {
    var content = this.get('content');
    var updatedExpenses = content.filter(function (item) {
      return item.id !== id;
    });

    var self = this;
    $.post('/api/remove/expense', {expenseId: id}, function (response) {
      if (response && response.ok) {
        self.set('content', updatedExpenses);
      } else {
        console.log(response); //TODO: Some type of error notification to the user
      }
    }, 'json');
  },

  setExpenses: function (expenses) {
    var userExpenses = [];
    var payer = null;
    var expense = null;

    for (var i = 0; i < expenses.length; i++) {
      payer = App.peopleController.get('content').findProperty('email', expenses[i].email);

      expense = App.expenseModel.create({
        id: expenses[i].id,
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
    $.post('/api/add/payout', function (reply) {
      if (reply && reply.ok) {
        self.get('payouts').pushObject(new Date().getTime() / 1000);
        App.timeSpanController.setSelectedToNewest();
      }
    }, 'json');
  },

  timeSpans: function () {
    var payouts = this.get('payouts').sort();

    if (payouts.length === 0) {
      var timeSpanAllTime = App.timeSpanModel.create({
        from: Number.NEGATIVE_INFINITY,
        to: Number.POSITIVE_INFINITY,
        isSelected: true
      });

      App.timeSpanController.set('timeSpans', [timeSpanAllTime]);
      return;
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

    payoutTimeSpans[payoutTimeSpans.length - 1].set('isSelected', true);
    App.timeSpanController.set('timeSpans', payoutTimeSpans.reverse());
  }.observes('payouts.@each')
});

App.timeSpanController = Ember.Object.create({
  timeSpans: [],

  selectedOrDefault: function () {
    var timeSpans = this.get('timeSpans');
    var selected = timeSpans.findProperty('isSelected', true);

    if (selected) {
      return selected;
    } else if(timeSpans && timeSpans.length > 0) {
      return timeSpans[0];
    } else {
      return App.timeSpanModel.create({
        isSelected: true
      });
    }
  }.property('timeSpans.@each.isSelected'),

  setSelectedToNewest: function () {
    var timeSpans = this.get('timeSpans');
    timeSpans.setEach('isSelected', false);
    if (timeSpans && timeSpans.length > 0) {
      timeSpans[0].set('isSelected', true);
    }
  },

  hasOneTimeSpan: function () {
    var timeSpans = this.get('timeSpans');
    return !Boolean(timeSpans && timeSpans.length && timeSpans.length > 1);
  }.property('timeSpans.@each'),

  /*onNewPayouts: function () {
    this.set('selectedTimeSpan', null);
  }.observes('timeSpans.@each'),*/

  onSelectedTimeSpanChanged: drawGraph.observes('selectedOrDefault.expenses.@each.amount')
});

App.userExpensesController = Ember.Object.create({
  userExpenses: function () {
    var people = App.peopleController.get('content');
    var currentTimeSpan = App.timeSpanController.get('selectedOrDefault');

    var userExpenses = [];

    for (var i = 0; i < people.length; i++) {
      userExpenses.push(App.userExpensesModel.create({
        payer: people[i],
        timeSpan: currentTimeSpan
      }));
    }

    return Ember.ArrayProxy.create({
      content: userExpenses
    });
  }.property('App.peopleController.content.@each', 'App.timeSpanController.selectedOrDefault')
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

    var email = $.cookie('email');

    var formData = {
      payer: email,
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

    $.post('/api/add/expense', expensePartial, function (reply) {
      if (reply && reply.errors && reply.errors.length > 0) {
        App.formAlertController.set('errors', reply.errors);
      } else if (reply && reply.ok) {
        App.formAlertController.set('errors', null);
        App.expensesController.addExpense(reply.insertId, formData.payer, expensePartial.amount, expensePartial.comment);
        App.expenseFormController.reset();
      } else {
        App.formAlertController.set('errors', ['Unknown response from server']);
      }
    }, 'json');
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
    var expenses = App.timeSpanController.get('selectedOrDefault').get('expenses').length;
    var totalPages = Math.ceil(expenses / 10.0);

    return (currentPage + 1) < totalPages;
  }.property('App.timeSpanController.selectedOrDefault.expenses.@each', 'currentPage'),

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
    var expenses = App.timeSpanController.get('selectedOrDefault').get('expenses');
    var maxIndex = currentPage * 10 + 10;

    if (maxIndex > expenses.length) {
      maxIndex = expenses.length;
    }

    return expenses.slice(currentPage * 10, maxIndex);
  }.property('currentPage', 'App.timeSpanController.selectedOrDefault.expenses.@each')
});

App.currentUserController = Ember.Object.create({
  user: null,

  loggedIn: function () {
    var user = this.get('user');
    return Boolean(user);
  }.property('user'),

  onLoggedInChanged: function () {
    $('.itemWithPopover').popover('hide');

    var loggedIn = this.get('loggedIn');

    if (!loggedIn) {
      $.cookie('authorization', null);
      $.cookie('email', null);
      setFakeData();
    }
  }.observes('loggedIn'),

  login: function (email, password, callback) {
    var self = this;
    var loginData = {
      email: email,
      password: password
    };

    $.post('/api/session/login', loginData, onPostComplete, 'json');

    function onPostComplete (responseData) {
      if (responseData && responseData.error) {
        callback(responseData.error);
      } else if (responseData && responseData.ok) {
        getAllData(function (err) {
          if (!err) {
            var currUser = App.peopleController.findProperty('email', $.cookie('email'));
            self.set('user', currUser);
          }

          callback(err);
        });
      }
    }
  },

  logout: function () {
    var self = this;

    $.getJSON('/api/session/logout', function (reply) {
      self.set('user', null);
    });
  }
});

App.loginFormController = Ember.Object.create({
  email: null,
  password: null,

  login: function () {
    var self = this;
    var email = this.get('email');
    var password = this.get('password');

    App.currentUserController.login(email, password, function (err) {
      if (!err) {
        self.set('email', null);
        self.set('password', null);
      } else {
        console.log(err); //TODO: Notification of some sort
      }
    });
  },

  logout: function () {
    App.currentUserController.logout();
  }
});

//------------------------------- Views -------------------------------

/*
 View of the total amounts that people have paid/owe
 */
App.summaryTableView = Ember.View.extend({
 userExpensesBinding: 'App.userExpensesController.userExpenses'
});

/*
 View of the most recent expenses
 */
App.expenseTableView = Ember.View.extend({
  contentBinding: 'App.pageController.expensesForPage'
});

App.expenseTableItem = Ember.View.extend({
  content: null, //To be filled in

  addedByUser: function () {
    var expensePayer = this.get('content').get('payer').get('email');
    var user = App.currentUserController.get('user');

    var userEmail = user && user.get('email');

    return expensePayer === userEmail;
  }.property('content.payer.email', 'App.currentUserController.user.email'),

  mouseEnter: function (event) {
    var content = this.get('content');
    var thisObject = $("#" + this.get('elementId'));

    var title = 'Expense from ' + content.get('timeStampStringLong');
    var popoverContent = '<table class="table">' + '<tr><td>Paid By:</td><td>' + content.get('payerString') + '</td>' + '<tr><td>Amount:</td><td>' + content.get('amountString') + '</td>' + '<tr><td>Comment:</td><td>' + content.get('comment') + '</td></tr>' + '</table>';

    thisObject.popover({
      title: title,
      content: popoverContent,
      placement: 'left'
    });

    thisObject.popover('show');
  },

  canRemove: function () {
    if (!this.get('addedByUser')) {
      return false;
    }

    var timeSpan = App.timeSpanController.get('selectedOrDefault');
    return timeSpan && timeSpan.get('isMostRecentTimeSpan');
  }.property('addedByUser', 'App.timeSpanController.selectedOrDefault.isMostRecentTimeSpan'),

  remove: function () {
    var thisObject = $("#" + this.get('elementId'));
    thisObject.popover('hide');
    App.expensesController.removeExpense(this.get('content').id);
  }
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
      return !App.currentUserController.get('loggedIn');
    }.property('App.currentUserController.loggedIn'),

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
  attributeBindings: ['disabled'],
  disabled: function () {
    var isLoggedIn = App.currentUserController.get('loggedIn');
    return !isLoggedIn;
  }.property('App.currentUserController.loggedIn'),

  click: function (event) {
    event.preventDefault();

    var confirmedPayout = confirm('Are you sure you want to start a new pay period, and move all current expenses to history?');
    if (confirmedPayout) {
      App.payoutController.addPayout();
    }
  }
});

App.loginControls = Ember.Object.create({
  emailView: Ember.TextField.extend({
    attributeBindings: ['placeholder'],
    placeholder: 'user@example.com',

    valueBinding: 'App.loginFormController.email'
  }),

  passwordView: Ember.TextField.extend({
    attributeBindings: ['placeholder'],
    placeholder: 'Password',

    type: 'password',
    valueBinding: 'App.loginFormController.password'
  }),

  submitView: Ember.View.extend({
    attributeBindings: ['type', 'value'],
    type: 'submit',
    value: 'Login',

    click: function (event) {
      event.preventDefault();
      App.loginFormController.login();
    }
  }),

  logoutView: Ember.View.extend({
    attributeBindings: ['type', 'value'],
    type: 'button',
    value: 'Log Out',

    click: function (event) {
      event.preventDefault();
      App.loginFormController.logout();
    }
  })
});

App.showCurrentTimeSpanView = Ember.View.extend({
  attributeBindings: ['href'],
  href: '#',

  click: function (event) {
    event.preventDefault();
    App.timeSpanController.setSelectedToNewest();
  }
});

App.miniTimeSpanView = Ember.View.extend({
  content: null, //To be set in view

  classNameBindings: ['isSelected'],

  isSelected: function () {
    var isSelected = this.get('content').get('isSelected');

    if (isSelected) {
      return 'miniTimeSpanSelected';
    } else {
      return 'miniTimeSpanNotSelected';
    }
  }.property('content.isSelected'),

  click: function (event) {
    event.preventDefault();

    App.timeSpanController.get('timeSpans').setEach('isSelected', false);
    var timeSpan = this.get('content');
    timeSpan.set('isSelected', true);

    $('#timeSpanModal').modal('hide');
  }
});

App.openTimeSpanView = Ember.View.extend({
  classNameBindings: ['disabled'],
  attributeBindings: ['disabled'],
  displayTextBinding: 'App.timeSpanController.selectedOrDefault.fullQualifier',

  disabledBinding: 'App.timeSpanController.hasOneTimeSpan',

  dataToggle: 'modal',
  href: '#timeSpanModal',

  click: function (event) {
    event.preventDefault();

    $('#timeSpanModal').modal('show');
  }
});

//------------------------------- Other -------------------------------

$(document).ready(function () {
  var hasAuthorization = Boolean($.cookie('authorization'));
  var hasEmail = Boolean($.cookie('email'));

  if (hasAuthorization && hasEmail) {
    getAllData(function (err) {
      if (!err) {
        var currUser = App.peopleController.findProperty('email', $.cookie('email'));
        App.currentUserController.set('user', currUser);
      } else {
        setFakeData();
      }
    });
  } else {
    setFakeData();
  }

  $('#timeSpanModal').modal({
    show: false
  });
});

function getAllData (callback) {
  jQuery.getJSON('/api/userInfo', function (reply) {
    if (reply && reply.ok) {
      setData(reply);
      callback();
    } else {
      callback('Unable to get data');
    }
  });
}

function setFakeData () {
  var now = Math.floor(new Date().getTime() / 1000);
  var beginTime = now - 604800;
  var payoutTime = now - 302400;

  var fakeData = {
    users: [
      {
        firstName: 'Donald',
        lastName: 'McFakerson',
        email: 'don@fake.com'
      },
      {
        firstName: 'Made',
        lastName: 'Up',
        email: 'made@fake.com'
      },
      {
        firstName: 'Not',
        lastName: 'Real',
        email: 'not@fake.com'
      }
    ],
    payouts: [payoutTime],
    expenses: []
  };

  for (var i = 0; i < Math.floor(Math.random() * 10 + 5); i++) {
    fakeData.expenses.push(getFakeExpense(beginTime, payoutTime));
  }

  for (i = 0; i < Math.floor(Math.random() * 10 + 5); i++) {
    fakeData.expenses.push(getFakeExpense(payoutTime, now));
  }

  setData(fakeData);

  function getFakeExpense (from, to) {
    var fakeComments = [
      'Gas bill', 'Electricity bill', 'Water bill', 'Cable bill', 'Phone bill', 'Groceries', 'Beer', 'Pizza'
    ];

    var delta = to - from;

    var expense = {
      email: fakeData.users[Math.floor(Math.random() * fakeData.users.length)].email,
      amount: Math.random() * 80 + 1,
      comment: fakeComments[Math.floor(Math.random() * fakeComments.length)],
      timeStamp: Math.floor(Math.random() * delta + from)
    };

    return expense;
  }
}

function setData (userData) {
  if (!userData) {
    return;
  }

  if (userData.error) {
    App.formAlertController.set('errors', [userData.error && userData.error.description]);
    return;
  }

  if (userData.users) {
    App.peopleController.setPeople(userData.users);
  } else {
    App.peopleController.setPeople([]);
  }

  if (userData.expenses) {
    App.expensesController.setExpenses(userData.expenses);
  } else {
    App.expensesController.setExpenses([]);
  }

  if (userData.payouts) {
    App.payoutController.set('payouts', userData.payouts);
  } else {
    App.payoutController.set('payouts', []);
  }
}

function drawGraph () {
  var userExpenses = App.userExpensesController.get('userExpenses').get('content');
  var container = document.getElementById("expenseGraphContainer");

  var colors = [];

  var min = 0;
  var max = 0;

  var expensesPerPerson = userExpenses.map(function (userExpenses, index) {
    var owe = userExpenses.get('oweForPayout');

    if (owe >= 0) {
      colors.push('#20BA0B');
    } else {
      colors.push('#FF0000');
    }

    min = Math.min(min, owe);
    max = Math.max(max, owe);

    return [[index, owe]];
  });

  var options = {
    bars: {
      show: true,
      horizontal: false,
      barWidth: .5
    },

    colors: colors,

    xaxis: {
      tickFormatter: formatXAxis,
      min: -.5,
      max: userExpenses.length -.5
    },

    yaxis: {
      min: min * 1.1,
      max: max * 1.1
    }
  };

  var horiLine = {
    data : [[-10, 0], [10, 0]],
    lines: {
      show: true
    },
    shadowSize : 0,
    color : '#545454'
  };

  expensesPerPerson.push(horiLine);

  Flotr.draw(container, expensesPerPerson, options);

  function formatXAxis (x) {
    var index = parseFloat(x);

    if (index % 1 === 0) {
      var person = userExpenses[index];
      return Boolean(person) ? person.get('payer').get('fullName') : '';
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
