# Colext

## What it is

Colext, or Collective Expenses Tracker, is made to keep track of
expenses that are split evenly between a group of people. An example
of this would be roommates splitting all the bills (water, gas,
electricity, cable, etc) evenly. When deciding if you want to use
Colext, keep these things in mind:


1. Expenses are split evenly across the whole group; there is no
partial expense-splitting
2. You can only belong to one group

So, if you are looking to keep track of individual expenses, Colext
is not for you. However, if you find yourself keeping track of expenses
with the same group of people over and over, Colext can help.

## What it does

Colext keeps track of how much individual group members have spent
on shared expenses compared to other group members, and uses that to
determine who owes/is owed money. To do so, Colect uses the simple
formula: [sum of expenses] / [number of people]. If a user has paid
more than that amount, they are owed money. If they have paid less,
they owe money. It's that simple.

## Features

Colext has several features that allow groups to easily keep track of
their money. First, a list of all the expenses, including the amount,
date, and a comment for each expense. Secondly, an easy-to-read table
specifying how much everyone has chipped into the money pool, and how
much they owe/are owed. Third, a graph display of how much each user
is owed/owes for quick reference. Lastly, the ability to reset the
expenses so everyone will be even. Past expenses will still be visible
by viewing the history, but won't count toward the current pool of expenses.

## Dependencies

The Colext server runs on nodejs, and uses MySQL for storing data.

## Installation

### Install dependencies

1. Install nodejs (www.nodejs.org)
2. Install MySQL (www.mysql.com)

### Edit config.json

After pulling down the code, you must edit config.json and set the
appropriate values for your MySQL server. The json file should contain
a line like this:

```json
"database": {
    "port": 3306, //Port your database is listening on
    "host": "127.0.0.1" //IP address or hostname of database server
}
```

### Install required node modules

Also, make sure to run
```bash
npm install
```
in the root project directory. This will install all of the required node
modules.

### Create tables in MySQL

Next, add a "ret" database to your MySQL server. This can be done by logging
into MySQL, and then running the command:
```sql
CREATE DATABASE "ret";
```

After that, run
```bash
node bin/dbSetup -u [MySQL username] -p [MySQL password]
```

### Add users/groups

At the moment, users and groups must be manually added to the users/groups tables
respectively.

First, add a group with the command
```sql
INSERT INTO GROUPS (name) VALUES ([Your group name]);
```

Next, run the following command for each user in the group:
```sql
INSERT INTO USERS (firstName, lastName, email, password, groupId) VALUES ([User's first name], [User's last name], [User's email], [User's password], [Id of the group just created]);
```

You should now be ready to go!

## Running Colext

Once you have nodejs and MySql setup, you can start Colext with the following
command:

```bash
node bin/app.js -u [MySQL username] -p [MySQL password]
```

The server will be listening on whatever port is specified in the config.json
file. For instance, to listen on port 3000:
```json
"server": {
    "port": 3000
}
```

## Credits

Colext relies on several projects, including, but not limited to:

### Node (www.nodejs.org)

All of the backend code was written in node. I chose it because that's what I'm
using at work, and you can never get enough practice.

### Emberjs (www.emberjs.com)

Used for all of the client side MVC. It is amazing for keeping data/views
synced up.

### Bootstrap (http://twitter.github.com/bootstrap/)

Makes the UI look a lot nicer than it would have if I had to do all the UI work.

### Glyphicons (http://glyphicons.com/)

All of the icons are from Glyphicons, through Bootstrap.

## License

Copyright (C) 2012 Aaron Probus

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
