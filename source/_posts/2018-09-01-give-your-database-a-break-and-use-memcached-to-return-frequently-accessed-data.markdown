---
layout: post
title: "Give your Database a break and use Memcached to return frequently accessed data"
date: 2018-09-01 17:05:10 -0400
comments: true
categories: ["caching", "memcached", "sql", "sqlite", "databases", "python"] 
---

![](https://objects.ruanbekker.com/assets/images/memcached-logo.png)

So let's take this scenario:

Your database is getting hammered with requests and building up some load over time and we would like to place a caching layer in front of our database that will return data from the caching layer, to reduce some traffic to our database and also improve our performance for our application.

## The Scenario:

Our scenario will be very simple for this demonstration:

- Database will be using SQLite with product information (product_name, product_description)
- Caching Layer will be Memcached
- Our Client will be written in Python, which checks if the product name is in cache, if not a `GET_MISS` will be returned, then the data will be fetched from the database, returns it to the client and save it to the cache
- Next time the item will be read, a `GET_HIT` will be received, then the item will be delivered to the client directly from the cache

## SQL Database:

As mentioned we will be using sqlite for demonstration.

Create the table, populate some very basic data:

```sql
$ sqlite3 db.sql -header -column
import sqlite3 as sql
SQLite version 3.16.0 2016-11-04 19:09:39
Enter ".help" for usage hints.

sqlite> create table products (product_name STRING(32), product_description STRING(32));
sqlite> insert into products values('apple', 'fruit called apple');
sqlite> insert into products values('guitar', 'musical instrument');
```

Read all the data from the table:

```sql
sqlite> select * from products;
product_name  product_description
------------  -------------------
apple         fruit called apple
guitar        musical instrument
sqlite> .exit
```

## Run a Memcached Container:

We will use docker to run a memcached container on our workstation:

```bash
$ docker run -itd --name memcached -p 11211:11211 rbekker87/memcached:alpine
```

## Our Application Code:

I will use [pymemcache](https://pymemcache.readthedocs.io/en/latest/getting_started.html) as our client library. Install:

```bash
$ virtualenv .venv && source .venv/bin/activate
$ pip install pymemcache
```

Our Application Code which will be in Python

```python
import sqlite3 as sql
from pymemcache.client import base

product_name = 'guitar'

client = base.Client(('localhost', 11211))
result = client.get(product_name)

def query_db(product_name):
    db_connection = sql.connect('db.sql')
    c = db_connection.cursor()
    try:
        c.execute('select product_description from products where product_name = "{k}"'.format(k=product_name))
        data = c.fetchone()[0]
        db_connection.close()
    except:
        data = 'invalid'
    return data

if result is None:
    print("got a miss, need to get the data from db")
    result = query_db(product_name)
    if result == 'invalid':
        print("requested data does not exist in db")
    else:
        print("returning data to client from db")
        print("=> Product: {p}, Description: {d}".format(p=product_name, d=result))
        print("setting the data to memcache")
        client.set(product_name, result)

else:
    print("got the data directly from memcache")
    print("=> Product: {p}, Description: {d}".format(p=product_name, d=result))
```

Explanation:

- We have a function that takes a argument of the product name, that makes the call to the database and returns the description of that product
- We will make a get operation to memcached, if nothing is returned, then we know the item does not exists in our cache,
- Then we will call our function to get the data from the database and return it directly to our client, and
- Save it to the cache in memcached so the next time the same product is queried, it will be delivered directly from the cache

## The Demo:

Our Product Name is `guitar`, lets call the product, which will be the first time so memcached wont have the item in its cache:

```bash
$ python app.py
got a miss, need to get the data from db
returning data to client from db
=> Product: guitar, Description: musical instrument
setting the data to memcache
```

Now from the output, we can see that the item was delivered from the database and saved to the cache, lets call that same product and observe the behavior:

```bash
$ python app.py
got the data directly from memcache
=> Product: guitar, Description: musical instrument
```

When our cache instance gets rebooted we will lose our data that is in the cache, but since the source of truth will be in our database, data will be re-added to the cache as they are requested. That is one good reason not to rely on a cache service to be your primary data source.


What if the product we request is not in our cache or database, let's say the product `tree`

```bash
$ python app.py
got a miss, need to get the data from db
requested data does not exist in db
```

This was a really simple scenario, but when working with masses amount of data, you can benefit from a lot of performance using caching.

## Resources:

- https://realpython.com/python-memcache-efficient-caching/
- https://github.com/ruanbekker/dockerhub-sources/tree/master/memcached/alpine
- https://pymemcache.readthedocs.io/en/latest/getting_started.html#basic-usage
- https://sebastianraschka.com/Articles/2014_sqlite_in_python_tutorial.html
