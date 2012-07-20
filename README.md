# Colext

## What it is

Colext, or Collective Expenses Tracker, is made to keep track of
expenses that are split evenly between a group of people. An example
of this would be roommates splitting all the bills (water, gas,
electricity, cable, etc) evenly. When deciding if you want to use
Colext, keep these things in mind:


1. Expenses are split evenly across the whole group, there is no
partial expense splitting
2. You can only belong to one group

So, if you are looking to keep track of individual expenses, Colext
is not for you. However, if you find yourself keeping track of expenses
with the same group of people over and over, Colext can help.

## What it does

Colext keeps track of how much everyone has spent on shared expenses
compared to the rest of the members of the group, and uses that to
determine who owes/is owed money. To do so, Colect uses the simple
formula: [sum of expenses] / [number of people]. If a user has paid
more than that amount, they are owed money. If they have paid less,
they owe money. It's that simple.

## Features

Colext has several features that allow groups to easily keep track of
their money. First, a list of all the expenses, including the amount,
date, and a comment for each expense. Secondly, an easy to read table
specifying how much everyone has chipped into the money pool, and how
much they owe/are owed. Third, a graph display of how much each user
is owed/owes for quick reference. Lastly, the ability to reset the
expenses so everyone will be even. Past expenses will still be visible
by viewing the history, but won't count to the current pool of expenses.

## Dependencies

The Colext server runs on nodejs, and uses MySQL for storing data.

## Installation

More to come

## Running Colext

Once you have nodejs and MySql setup, you can start Colext with the following
command:

~~~~
node bin/app.js -u [MySQL username] -p [MySQL password]
~~~~
