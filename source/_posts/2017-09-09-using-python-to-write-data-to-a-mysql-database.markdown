---
layout: post
title: "Using Python to Write Data to a MySQL Database"
date: 2017-09-09 16:39:59 -0400
comments: true
categories: ["python", "mysql"] 
---

From our [previous](http://blog.ruanbekker.com/blog/2017/09/09/using-python-to-read-data-from-a-mysql-database/) post, we used python to read data from mysql. In this post we will be using the `random` library to write random data into mysql.

We will define our lists with the categorized data, and then using for loop, to write data into our mysql database:

## Create The Database:

Using Python to Create the Database:

```python
>>> conn = pdb.connect(host=db_host, user=db_username, passwd=db_password)
>>> cursor = conn.cursor()
>>> cursor.execute("CREATE DATABASE testdb1")
1L
>>> cursor.execute("CREATE TABLE testdb1.myusers(name VARCHAR(50), surname VARCHAR(50), countries VARCHAR(50), job VARCHAR(20), os VARCHAR(20), car VARCHAR(20))")
0L
```

Now to list our databases:

```python
>>> cursor.execute("show databases")
12L

>>> dbs = cursor.fetchall()
>>> for x in dbs:
...     print(x)
...

('information_schema',)
('mysql',)
('performance_schema',)
('testdb1',)
```

## Python Code to Write to MySQL

We will create a `mysql_write.py` file, with the following contents to define our random data that we will write to our mysql database. The config module can be found from [this](http://blog.ruanbekker.com/blog/2017/09/09/using-python-to-read-data-from-a-mysql-database/) post.

```python mysql_write.py
import MySQLdb as pdb
from config import credentials as secrets
import random
import datetime

db_host = secrets['mysql']['host']
db_username = secrets['mysql']['username']
db_password = secrets['mysql']['password']
db_name = secrets['mysql']['database']

for x in range(10):
    a = random.choice(names)
    b = random.choice(surnames)
    c = random.choice(countries)
    d = random.choice(job)
    e = random.choice(os)
    f = random.choice(car)
    
    cursor.execute("INSERT INTO myusers values('{name}', '{surname}', '{countries}', '{job}', '{os}', '{car}');".format(name=a, surname=b, countries=c, job=d, os=e, car=f))

conn.commit()
conn.close()
```

After running the file: `python mysql_write.py` we should have 10 records in our database.

## Reading the Data from MySQLL

To verify that the data is in our MySQL Database, lets logon to our mysql database:

```bash
$ mysql -u root -p
```
```mysql
mysql> select * from testdb1.myusers;
+----------+----------+-----------+----------------+---------+---------------+
| name     | surname  | countries | job            | os      | car           |
+----------+----------+-----------+----------------+---------+---------------+
| James    | James    | New York  | Waiter         | Mac     | Volkswagen    |
| Jennifer | Smith    | New York  | Scientist      | Windows | Audi          |
| Michelle | Jacobs   | Italy     | Police Officer | Mac     | Ford          |
| Michelle | Anderson | Italy     | Waiter         | Windows | Ford          |
| Jennifer | Smith    | England   | Doctor         | Windows | Toyota        |
| Peter    | Jacobs   | England   | IT             | Windows | BMW           |
| Samantha | James    | England   | Doctor         | Mac     | Mazda         |
| Frank    | Phillips | England   | IT             | Mac     | BMW           |
| Samantha | James    | England   | Banker         | Linux   | Mercedez-Benz |
| Peter    | Anderson | Sweden    | Doctor         | Windows | BMW           |
+----------+----------+-----------+----------------+---------+---------------+
```

Next, lets use Python to do the same, create a file `mysql_read.py` with the following content:

```python
import MySQLdb as pdb
from config import credentials as secrets

db_host = secrets['mysql']['host']
db_username = secrets['mysql']['username']
db_password = secrets['mysql']['password']
db_name = secrets['mysql']['database']

conn = pdb.connect(host=db_host, user=db_username, passwd=db_password, db=db_name)
cursor = conn.cursor()

cursor.execute("select * from myusers")
read = cursor.fetchall()

for x in read:
    print(x)

conn.close()
```

Running the Python file, to read the data:

```bash
$ python mysql_read.py

('James', 'James', 'New York', 'Waiter', 'Mac', 'Volkswagen')
('Jennifer', 'Smith', 'New York', 'Scientist', 'Windows', 'Audi')
('Michelle', 'Jacobs', 'Italy', 'Police Officer', 'Mac', 'Ford')
('Michelle', 'Anderson', 'Italy', 'Waiter', 'Windows', 'Ford')
('Jennifer', 'Smith', 'England', 'Doctor', 'Windows', 'Toyota')
('Peter', 'Jacobs', 'England', 'IT', 'Windows', 'BMW')
('Samantha', 'James', 'England', 'Doctor', 'Mac', 'Mazda')
('Frank', 'Phillips', 'England', 'IT', 'Mac', 'BMW')
('Samantha', 'James', 'England', 'Banker', 'Linux', 'Mercedez-Benz')
('Peter', 'Anderson', 'Sweden', 'Doctor', 'Windows', 'BMW')
``` 

<center>
        <script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script>
</center>
