---
layout: post
title: "Improve MySQL Write Performance using Batch Writes"
date: 2020-06-13 19:31:32 +0200
comments: true
description: "Never use sequential writes when you have lots of records to write at once, rather use batch writes to improve write performance"
categories: ["databases", "mysql", "performance", "python"]
---

![mysql-python-performance](https://img.sysadmins.co.za/wngib2.png)

I am no DBA, but I got curious when I noticed sluggish write performance on a mysql database, and I remembered somewhere that you should always use batch writes over sequential writes. So I decided to test it out, using a python script and a mysql server.

## What will we be doing

I wrote a python script that writes 100,000 records to a database and keeps time of how long the writes took, 2 examples which I will compare:

  * One script writing each record to the database
  * One script writing all the records as batch 

## Sequential Writes

It took 48 seconds to write 100,000 records into a database using sequential writes:

```python
...
for user in userids:
    userid = user["uid"]
    name = user["uid"].split('_')[0]
    job = random.choice(job)
    age = random.randint(24,49)
    credit_card_num = user["ccnum"]
    status = random.choice(["active", "inactive", "disabled"])

    cur.execute(
        """INSERT INTO customers(userid, name, job, age, credit_card_num, status) VALUES(%s, %s, %s, %s, %s, %s)""",
        (userid, name, job, age, credit_card_num, status)
    )
...
```

Running that shows us this:

```
$ python3 mysql_seq_writes.py
start
writing customers to database
finish
inserted 100000 records in 48s
```

## Batch Writes

It took 3 seconds to write to write 100,000 records using batch writes:

```python
...
for user in userids:
    userid = user["uid"]
    name = user["uid"].split('_')[0]
    job = random.choice(job)
    age = random.randint(24,49)
    credit_card_num = user["ccnum"]
    status = random.choice(["active", "inactive", "disabled"])

    bunch_users.append((userid, name, job, age, credit_card_num, status))

cur.executemany(
    """INSERT INTO customers(userid, name, job, age, credit_card_num, status) VALUES(%s, %s, %s, %s, %s, %s)""",
    bunch_users
)
...
```

Running that shows us this:

```
$ python3 mysql_batch_writes.py
start
writing customers to database
finish
inserted 100000 records in 3s
```

## Looking at the Scripts

The script used for sequential writes:

```python
import datetime
import random
import MySQLdb
from datetime import datetime as dt

host="172.18.0.1"
user="root"
password="password"
dbname="shopdb"
records=100000

db = MySQLdb.connect(host, user, password, dbname)

names = ['ruan', 'donovan', 'james', 'warren', 'angie', 'nicole', 'jenny', 'penny', 'amber']
job = ['doctor', 'scientist', 'teacher', 'police officer', 'waiter', 'banker', 'it']

cur = db.cursor()
cur.execute("DROP TABLE IF EXISTS customers")
cur.execute("CREATE TABLE customers(userid VARCHAR(50), name VARCHAR(50), surname VARCHAR(50), job VARCHAR(50), age INT(2), credit_card_num VARCHAR(50), status VARCHAR(10))")

bunch_users = []
userids = []

print("start")

def gen_id():
    return str(random.randint(0,9999)).zfill(4)

def gen_user(username):
    ccnum = '{0}-{1}-{2}-{3}'.format(gen_id(), gen_id(), gen_id(), gen_id())
    userid = username + '_' + ccnum.split('-')[0] + ccnum.split('-')[2]
    return {"uid": userid, "ccnum": ccnum}

for name in range(records):
    userids.append(gen_user(random.choice(names)))

print("writing customers to database")

timestart = int(dt.now().strftime("%s"))

for user in userids:
    userid = user["uid"]
    name = user["uid"].split('_')[0]
    job = random.choice(job)
    age = random.randint(24,49)
    credit_card_num = user["ccnum"]
    status = random.choice(["active", "inactive", "disabled"])

    #bunch_users.append((userid, name, job, age, credit_card_num, status))

    cur.execute(
        """INSERT INTO customers(userid, name, job, age, credit_card_num, status) VALUES(%s, %s, %s, %s, %s, %s)""",
        (userid, name, job, age, credit_card_num, status)
    )

db.commit()
db.close()
timefinish = int(dt.now().strftime("%s"))
print("finish")
print("inserted {} records in {}s".format(records, timefinish-timestart))
```

The script used for the batch writes:

```python
import datetime
import random
import MySQLdb
from datetime import datetime as dt

host="172.18.0.1"
user="root"
password="password"
dbname="shopdb"
records=100000

db = MySQLdb.connect(host, user, password, dbname)

names = ['ruan', 'donovan', 'james', 'warren', 'angie', 'nicole', 'jenny', 'penny', 'amber']
job = ['doctor', 'scientist', 'teacher', 'police officer', 'waiter', 'banker', 'it']

cur = db.cursor()
cur.execute("DROP TABLE IF EXISTS customers")
cur.execute("CREATE TABLE customers(userid VARCHAR(50), name VARCHAR(50), surname VARCHAR(50), job VARCHAR(50), age INT(2), credit_card_num VARCHAR(50), status VARCHAR(10))")

bunch_users = []
userids = []

print("start")

def gen_id():
    return str(random.randint(0,9999)).zfill(4)

def gen_user(username):
    ccnum = '{0}-{1}-{2}-{3}'.format(gen_id(), gen_id(), gen_id(), gen_id())
    userid = username + '_' + ccnum.split('-')[0] + ccnum.split('-')[2]
    return {"uid": userid, "ccnum": ccnum}

for name in range(records):
    userids.append(gen_user(random.choice(names)))

for user in userids:
    userid = user["uid"]
    name = user["uid"].split('_')[0]
    job = random.choice(job)
    age = random.randint(24,49)
    credit_card_num = user["ccnum"]
    status = random.choice(["active", "inactive", "disabled"])

    bunch_users.append((userid, name, job, age, credit_card_num, status))

timestart = int(dt.now().strftime("%s"))

print("writing customers to database")
cur.executemany(
    """INSERT INTO customers(userid, name, job, age, credit_card_num, status) VALUES(%s, %s, %s, %s, %s, %s)""",
    bunch_users
)

db.commit()
db.close()
timefinish = int(dt.now().strftime("%s"))
print("finish")
print("inserted {} records in {}s".format(records, timefinish-timestart))
```

## Thanks

Thanks for reading, so this was kind of interesting to see to never do sequential writes but write them in bulk when you have large amount of writes.
