---
layout: post
title: "Using Python to Read Data from a MySQL Database"
date: 2017-09-09 15:23:05 -0400
comments: true
categories: ["python", "mysql", "pandas", "plotly"] 
---

Wanted to use Python to read some data from MySQL and stumbled upon a couple of great resources, which I noted some of my output below:

## Install Dependencies:

```bash 
$ apt install python-dev libmysqlclient-dev python-setuptools gcc
$ easy_install pip
$ pip install MySQL-python
```

## Download Some Sample Data:

Download the world dataset for MySQL:

```bash
$ wget http://downloads.mysql.com/docs/world.sql.zip
$ unzip world.sql.zip
```

## Create Database:

Create the Database in MySQL for the dataset that we downloaded:

```bash
$ mysql -u root -p -e'CREATE DATABASE world;'
```

## Import Data:

Import the data into the `world` database:

```bash
$ mysql -u root -p world < world.sql
```

## Create the MySQL Credentials File:

Create a `config.py` file and populate the credentials in a dictionary:

```python
credentials = {
	'mysql': {
		'host': 'localhost',
		'username': 'root',
		'password': 'password',
		'database': 'world'
	}
}
```

## Run Queries from Python:

Enter the Python interpreter and run some queries:

```python
>>> import MySQLdb as pdb
>>> from config import credentials as secrets

# assignments 
>>> db_host = secrets['mysql']['host']
>>> db_username = secrets['mysql']['username']
>>> db_password = secrets['mysql']['password']
>>> db_name = secrets['mysql']['database']

# create a connection to the database
>>> conn = pdb.connect(host=db_host, user=db_username, passwd=db_password, db=db_name)

# create a object for the queries we will be using
>>> cursor = conn.cursor()

# execute the query
>>> cursor.execute('select continent, name from country where continent = "Africa" limit 5')
5L

# fetch the results by assigning it to the results object:
>>> results = cursor.fetchall()

# loop and print results:
>>> for x in results:
...     print(x)
...
('Africa', 'Angola')
('Africa', 'Burundi')
('Africa', 'Benin')
('Africa', 'Burkina Faso')
('Africa', 'Botswana')

# close the connection
>>> conn.close()
```

## Graphing Results to Plotly:

A great [blogpost](http://moderndata.plot.ly/graph-data-from-mysql-database-in-python/) that shows how to use this data to graph the results to plotly

## Resources:

- http://moderndata.plot.ly/graph-data-from-mysql-database-in-python/
- https://stackoverflow.com/questions/11007627/python-variable-declaration

<p>
<center>
<script type='text/javascript' src='https://ko-fi.com/widgets/widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Buy Me a Coffee', '#46b798', 'A6423ZIQ');kofiwidget2.draw();</script> 
</center>
