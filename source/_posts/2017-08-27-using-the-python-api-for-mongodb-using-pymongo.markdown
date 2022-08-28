---
layout: post
title: "Using the Python API for MongoDB using PyMongo"
date: 2017-08-27 16:19:48 -0400
comments: true
categories: ["mongodb", "nosql", "python", "api", "databases"] 
---


Using the Python API for MongoDB using Pymongo

## Requirements:

You will need to install the `pymongo` driver using pip:

```bash Install Pymongo
$ pip install pymongo
```

A configuration file with your access credentials, which I like to use outside my code:

```bash config.py
credentials = {
    "mongodb": {
        "HOSTNAME": "host.domain.com",
        "USERNAME": "username",
        "PASSWORD": "password"
    }
}
```

## Connecting to MongoDB:

From the python interpreter, connect to MongoDB:

```python 
>>> from pymongo import MongoClient
>>> from config import credentials as secrets
>>> mongo_host = secrets['mongodb']['HOSTNAME']
>>> mongo_username = secrets['mongodb']['USERNAME']
>>> mongo_password = secrets['mongodb']['PASSWORD']
>>> mongodb_client = MongoClient('mongodb://%s:%s@%s:27017/admin?authMechanism=SCRAM-SHA-1' % (mongo_username, mongo_password, mongo_host))
```

Find the Database that you are connected to:

```python
>>> mongodb_client.get_database().name
u'admin'
```

Find all the databases that is currently on your MongoDB Server:

```python
>>> dbs = mongodb_client.database_names()
>>> for x in dbs:
...     print(x)
...
admin
flask_reminders
local
```

## Create a Database, Collection and Write a Document into your Database:

Let's create a database, in my case it will be `ruan-test`, and my collection name `mycollection` and the write one item into it:

```python
>>> newdb = mongodb_client['ruan-test']
>>> newdb_collection = newdb['mycollection']
>>> doc = {"name": "frank", "surname": "jeffreys", "tags": ["person", "name"]}
>>> doc_id = newdb_collection.insert_one(doc).inserted_id
>>> print(doc_id)
59a319ec1f15a5088ba3a339
```

Note: you can also connect to your collection like the following

```python
>>> newdb_collection = mongodb_client['ruan-test']['mycollection']
```

We have inserted one item into our database, which we can verify with `count()`:

```python
>>> newdb_collection.find().count()
1
```

As you can see I have the value of the item's id, we can use that to find it from our collection:

```python
>>> newdb_collection.find_one({"_id": doc_id})
{u'_id': ObjectId('59a319ec1f15a5088ba3a339'), u'surname': u'jeffreys', u'name': u'frank', u'tags': [u'person', u'name']}
```

As we only have one item in our database, we can also use `find_one()` which will give us the exact same data:

```python
>>> newdb_collection.find_one()
{u'_id': ObjectId('59a319ec1f15a5088ba3a339'), u'surname': u'jeffreys', u'name': u'frank', u'tags': [u'person', u'name']}
```

We can write some more data to our database, but this time, lets write to a different collection:

```python
>>> newdb_collection2 = newdb['new-collection-2']
>>> item = newdb_collection2.insert_one({"name": "ruby", "surname": "james"}).inserted_id
>>> item2 = newdb_collection2.insert_one({"name": "ruby", "surname": "james"}).inserted_id
```

As we captured the items `_id`, we can view the:

```python
>>> print(item)
59a31acf1f15a5088ba3a33b
>>> print(item2)
59a31a8a1f15a5088ba3a33a
```

## Query Data from MongoDB:

We can then query for this data:

```python
>>> newdb2.find_one({"name": "ruby"})
{u'_id': ObjectId('59a31acf1f15a5088ba3a33b'), u'surname': u'james', u'name': u'ruby'}

>>> newdb2.find_one({"_id": item})
{u'_id': ObjectId('59a31acf1f15a5088ba3a33b'), u'surname': u'james', u'name': u'ruby'}
```

Also scan for all items in the collection:

```python
>>> scan = newdb_collection2.find({})
>>> for x in scan:
...     print(x)
...
{u'_id': ObjectId('59a31a8a1f15a5088ba3a33a'), u'surname': u'james', u'name': u'phillip'}
{u'_id': ObjectId('59a31acf1f15a5088ba3a33b'), u'surname': u'james', u'name': u'ruby'}

>>> newdb2.find().count()
2
```

We can now verify that we have 2 collections in our database:

```python
>>> newdb.collection_names()
[u'mycollection-2', u'mycollection']
```

## Connecting to an existing Database:

Let's connect to an existing database on our MongoDB Server:

```python
>>> flaskdb = mongodb_client['flask_reminders']
```

List the collections:

```python
>>> flaskdb.collection_names()
[u'reminders', u'usersessions']
```

Count the number of items in our `reminders` Collection:

```python
>>> flaskdb.reminders.find().count()
624
```

Find a Random Item:

```python
>>> flaskdb.reminders.find_one()
{u'category': u'Python', u'description': u'Chatbot with SQLite', u'link': u'http://rodic.fr/blog/python-chatbot-1/', u'date': u'2017-01-03', u'_id': ObjectId('586bb6dd0269103671afce32'), u'type': u'Discovered Service'}
```

Find One Item, with a Specific Value, for example the value `AWS` for our `Category key`:

```python
>>> flaskdb.reminders.find_one({"category": "AWS"})
{u'category': u'AWS', u'description': u'Elasticsearch Documentation Access Policies', u'link': u'http://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-createupdatedomains.html#es-createdomain-configure-access-policies', u'date': u'2017-02-13', u'_id': ObjectId('58a1d45202691070616947c3'), u'type': u'Documentation'}
```

Find All Items, with a specific value:

```python
>>> data = flaskdb.reminders.find({"category": "AWS"})
>>> for x in data:
...     print(x)
...
{u'category': u'Python', u'description': u'Chatbot with SQLite', u'link': u'http://rodic.fr/blog/python-chatbot-1/', u'date': u'2017-01-03', u'_id': ObjectId('586bb6dd0269103671afce32'), u'type': u'Discovered Service'}
{u'category': u'Python', u'description': u'Boto: Kinesis List', u'link': u'https://gitlab.com/rbekker87/code-examples/blob/master/kinesis/firehose/python/firehose.list.py', u'date': u'2017-01-05', u'_id': ObjectId('586dde1e0269103671afce36'), u'type': u'Stuff Done'}
```

## Deleting Databases:

Cleaning up, deleting the database that we created, when a database is delete, the collections within that database also gets removed. 

First list the databases:

```
>>> dbs = mongodb_client.database_names()
>>> for x in dbs:
...     print(x)
...
admin
flask_reminders
local
ruan-test
```

Then delete the database that you want to delete:

```python
>>> mongodb_client.drop_database("ruan-test")
```

Then verify if the database was removed:

```python
>>> dbs = mongodb_client.database_names()
>>> for x in dbs:
...     print(x)
...
admin
flask_reminders
local
```

## Resources:

- http://api.mongodb.com/python/current/tutorial.html
- https://docs.mongodb.com/getting-started/python/client/
