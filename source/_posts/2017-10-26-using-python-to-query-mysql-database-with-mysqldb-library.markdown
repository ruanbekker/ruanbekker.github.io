---
layout: post
title: "Using Python to Query MySQL Database with MySQLdb Library"
date: 2017-10-26 03:40:11 -0400
comments: true
categories: ["python", "mysql", "databases"] 
---

a Quick post to demostrate how to use Python to Query data from MySQL. We will use the MySQL Docker Image for the demonstration.

## Provision MySQL

We will use the latest mysql image, and use the environment variable to pass the root password, and also expose the mysql port:

```bash
$ docker run -itd -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql
```

## Populate some data in MySQL

Connect to MySQL:

```bash
$ mysql -h 127.0.0.1 -u root -ppasword
```

Create some test data:

```sql
mysql> create database foo;
mysql> use foo;
mysql> create table bar (name VARCHAR(20), surname VARCHAR(20));
mysql> insert into bar values('ruan', 'bekker');
mysql> insert into bar values('stefan', 'bester');
mysql> insert into bar values('peter', 'williams');
```

## Python with MySQL: Setup the Environment

We will use virtualenv to create a virtual environment to keep our installation isolated from the rest of our system. Install virtualenv:

```bash
$ pip install virtualenv
```

Create a virtual environment and install the required dependency:

```bash
$ virtualenv venv-mysql
$ source venv-mysql/bin/activate
(venv-mysql) pip install MySQL-python
```

## Python with MySQL: Develop the Client

```python
>>> import MySQLdb
>>> db = MySQLdb.connect('127.0.0.1', 'root', 'password', 'foo')
>>> con = db.cursor()
>>> con.execute("SELECT * from bar")
4L
>>> rows = con.fetchall()
>>> for row in rows:
...     print(row[0], row[1])
... 
('ruan', 'bekker')
('stefan', 'bester')
('peter', 'williams')
>>> exit()
```


